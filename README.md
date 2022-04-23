# Demo implementation for `$smart-app-state` operations

Details at https://hackmd.io/@argonaut/smart-app-state


## Examples

### Prepare Example JSON file

```sh
$ cat <<EOF > example.json
{
  "resourceType": "Basic",
  "subject": {
    "reference": "Patient/123"
  },
  "code": {
    "coding": [
      {
        "system": "https://test.example.org",
        "code": "preferences"
      }
    ]
  },
  "extension": [
    {
      "url": "https://test.example.org/preferences/color/v1",
      "valueString": "orange"
    }
  ]
}
EOF
```

### Create
```sh
$ cat example.json | \
  curl -X POST  'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
  -H "content-type: application/json" \
  -H "Authorization: Bearer secret-shh-fixme" \
  --data @- \
  > created.json
```

### Query
```sh
$ curl -X GET  'https://smart-app-state.argonaut.workers.dev/$smart-app-state-query?subject=Patient/123&code=https://test.example.org|preferences' \
  -H "Authorization: Bearer secret-shh-fixme"
```

### Delete

To request a delete, we remove all extensions from our resourcetake the original example, remove the extension, and add in the created item `id`...

```sh
$ cat created.json  | jq "del(.extension)" | \
   curl -X POST  'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
  -H "content-type: application/json" \
  -H "Authorization: Bearer secret-shh-fixme" \
  --data @-
```
