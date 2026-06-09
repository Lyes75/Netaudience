# n8n — Tracking offline lead → conversion GA4

Boucle complète :  
**Formulaire contact → Webhook n8n → Google Sheets → [validation manuelle] → Measurement Protocol → GA4**

---

## Architecture

```
[contact.html]
   └─ fetch POST JSON → Webhook n8n (Workflow A)
                           └─ Google Sheets "Leads" (statut = nouveau)
                                      ↑
                              validation manuelle
                              (changer statut → client_signe + remplir valeur)
                                      ↓
                           Workflow B (schedule 2 min)
                           └─ filtre statut=client_signe ET envoye vide
                               └─ Measurement Protocol GA4 (event contrat_signe)
                                   └─ Google Sheets envoye=oui + date_envoi
```

---

## 1. Pré-requis

| Outil | Version minimale |
|---|---|
| n8n | 1.0+ (testé en self-hosted et cloud) |
| Google Sheets | Un Sheet avec un onglet nommé **Leads** |
| GA4 | Propriété G-ELXLY0ZK0H avec API Secret activé |

---

## 2. Créer l'API Secret GA4

1. GA4 → **Admin** → votre propriété → **Flux de données** → cliquer sur le flux web
2. Section **Measurement Protocol API secrets** → **Créer**
3. Donner un libellé (ex: `n8n-prod`) → copier la valeur
4. Dans n8n : **Settings → Environment variables** → ajouter `GA4_API_SECRET = <valeur>`  
   _(ne jamais coller la valeur directement dans le workflow)_

---

## 3. Préparer le Google Sheet

Créer un onglet **Leads** avec ces colonnes **exactement en ligne 1** (casse et ordre libres,
mais les noms doivent correspondre) :

```
ts | prenom | nom | email | telephone | societe | secteur | besoin | message | ga_client_id | ga_session_id | statut | valeur | envoye | date_envoi
```

Relever l'**ID du Sheet** dans l'URL :  
`https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`

---

## 4. Importer les workflows

1. n8n → **Workflows → Import from file**
2. Importer `workflow-a-intake.json` puis `workflow-b-validation-ga4.json`
3. **Dans chaque workflow** remplacer `VOTRE_GOOGLE_SHEET_ID` par l'ID réel
4. Configurer les credentials Google Sheets sur les deux nœuds Google Sheets
   (OAuth2 ou Service Account)

> **Si l'import échoue** (incompatibilité de version) : recréer manuellement
> en suivant la section « Configuration nœud par nœud » ci-dessous.

---

## 5. Configurer le WEBHOOK_URL dans main.js

Après activation du Workflow A, copier l'URL du webhook affiché par n8n :
```
https://n8n.votre-domaine.fr/webhook/netaudience-lead
```

Dans `js/main.js`, ligne ~231, remplacer :
```javascript
var WEBHOOK_URL = 'REMPLACER_PAR_VOTRE_WEBHOOK_URL';
```
par l'URL réelle, puis pusher sur GitHub.

---

## 6. Tester avant la mise en prod

### Test Workflow A
1. Activer le workflow A
2. Soumettre le formulaire de contact avec un vrai navigateur (cookies GA4 présents)
3. Vérifier qu'une ligne apparaît dans le Sheet avec `ga_client_id` rempli et `statut = nouveau`

### Test Measurement Protocol (debug)
Avant d'activer le workflow B en prod, tester sur l'endpoint debug :

```bash
curl -X POST \
  "https://region1.google-analytics.com/debug/mp/collect?measurement_id=G-ELXLY0ZK0H&api_secret=VOTRE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "123456789.1234567890",
    "events": [{
      "name": "contrat_signe",
      "params": {
        "session_id": "1700000000",
        "value": 1500,
        "currency": "EUR",
        "engagement_time_msec": 1
      }
    }]
  }'
```

La réponse doit retourner `{ "validationMessages": [] }`.  
Puis vérifier l'event dans **GA4 → DebugView**.

### Test Workflow B (fin-à-fin)
1. Dans le Sheet, passer une ligne test à `statut = client_signe` et remplir `valeur = 1500`
2. Exécuter manuellement le Workflow B (bouton **Execute Workflow**)
3. Vérifier dans GA4 DebugView que l'event `contrat_signe` apparaît, attribué à la source d'origine
4. Vérifier que la ligne du Sheet a `envoye = oui` et `date_envoi` rempli
5. Re-exécuter → la ligne ne doit PAS générer un second event (déduplication)

---

## 7. Configuration nœud par nœud (si import JSON échoue)

### Workflow A — Lead Intake

#### Nœud 1 : Webhook
- **Type** : Webhook
- **HTTP Method** : POST
- **Path** : `netaudience-lead`
- **Response mode** : Immediately  
- **Response data** : No data (204)
- **Options → Allowed Origins** : `https://www.netaudience.fr`

#### Nœud 2 : Code — Préparer ligne
- **Language** : JavaScript
```javascript
const body = $input.first().json.body ?? $input.first().json;

return [{
  json: {
    ts:            new Date().toISOString(),
    prenom:        String(body.prenom        ?? ''),
    nom:           String(body.nom           ?? ''),
    email:         String(body.email         ?? ''),
    telephone:     String(body.telephone     ?? ''),
    societe:       String(body.societe       ?? ''),
    secteur:       String(body.secteur       ?? ''),
    besoin:        String(body.besoin        ?? ''),
    message:       String(body.message       ?? ''),
    ga_client_id:  body.ga_client_id  != null ? String(body.ga_client_id)  : '',
    ga_session_id: body.ga_session_id != null ? String(body.ga_session_id) : '',
    statut:        'nouveau',
    valeur:        '',
    envoye:        ''
  }
}];
```

#### Nœud 3 : Google Sheets — Append Row
- **Operation** : Append Row
- **Document** : votre Sheet (par ID)
- **Sheet** : `Leads`
- **Mapping** : défini ci-dessous (chaque colonne → `={{ $json.<champ> }}`)

---

### Workflow B — Validation → GA4

#### Nœud 1 : Schedule Trigger
- **Trigger interval** : Every 2 minutes

#### Nœud 2 : Google Sheets — Get All Rows
- **Operation** : Get All Rows
- **Document** : votre Sheet (par ID)
- **Sheet** : `Leads`

#### Nœud 3 : Code — Filtrer et préparer MP
```javascript
const items = $input.all();

// Numérotation des lignes (ligne 1 = header)
const withRowNumber = items.map((item, idx) => ({
  ...item,
  json: { ...item.json, _rowNumber: idx + 2 }
}));

const toProcess = withRowNumber.filter(item => {
  const d = item.json;
  return (
    d.statut === 'client_signe' &&
    (!d.envoye || String(d.envoye).trim() === '') &&
    d.ga_client_id && String(d.ga_client_id).trim() !== ''
  );
});

if (toProcess.length === 0) return [];

return toProcess.map(item => ({
  json: {
    _rowNumber: item.json._rowNumber,
    client_id:  item.json.ga_client_id,
    session_id: item.json.ga_session_id || '',
    value:      parseFloat(item.json.valeur) || 0,
    mp_payload: {
      client_id: item.json.ga_client_id,
      events: [{
        name: 'contrat_signe',
        params: {
          session_id:           item.json.ga_session_id || '',
          value:                parseFloat(item.json.valeur) || 0,
          currency:             'EUR',
          engagement_time_msec: 1
        }
      }]
    }
  }
}));
```

#### Nœud 4 : HTTP Request — Measurement Protocol
- **Method** : POST
- **URL** : `https://region1.google-analytics.com/mp/collect`
- **Query Parameters** :
  - `measurement_id` = `G-ELXLY0ZK0H`
  - `api_secret` = `={{ $env.GA4_API_SECRET }}`
- **Body** : JSON
  ```
  ={{ JSON.stringify($json.mp_payload) }}
  ```
- **Options → Never error** : activé (GA4 renvoie 204, pas de body)

#### Nœud 5 : Google Sheets — Marquer envoye=oui
- **Operation** : Update Row
- **Document / Sheet** : mêmes que ci-dessus
- **Row number** : `={{ $('Code — Filtrer et préparer MP').item.json._rowNumber }}`
- **Colonnes à mettre à jour** :
  - `envoye` = `oui`
  - `date_envoi` = `={{ new Date().toISOString() }}`

---

## 8. Sécurité et conformité

- **Aucune PII** dans le payload Measurement Protocol : seuls `client_id`, `session_id`,
  `value` et `currency` sont envoyés vers GA4.
- `api_secret` stocké exclusivement en variable d'environnement n8n (`$env.GA4_API_SECRET`).
- La conversion ne part vers GA4 qu'à la validation manuelle (`statut = client_signe`).
- La colonne `envoye` garantit la déduplication : un lead traité ne génère jamais deux events.
- Activer HTTPS sur votre instance n8n (certificat TLS obligatoire).
