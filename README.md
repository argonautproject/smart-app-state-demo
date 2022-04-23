# Demo implementation for `$smart-app-state` operations

Details at https://hackmd.io/@argonaut/smart-app-state


## Examples

### Create

To create, we `POST` a `Basic` resource  with a subject (i.e., "state associated with whom"), a single code (i.e., "what kind of state?"), and our own data in simple extensions:


```sh
$ echo '{
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
  }' | \
curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
  -X POST \
  -H "content-type: application/json" \
  -H "Authorization: Bearer secret-shh-fixme" \
  --data @- \
> created.json
```


### Update

To update, we `POST` a copy of the resource where our extensions change, and everything else stays the same:


```sh
$ cat created.json  | \
jq '. + {extension: [{"url": "https://test.example.org", "valueString": "purple"}]}'| \
curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
  -X POST \
  -H "content-type: application/json" \
  -H "Authorization: Bearer secret-shh-fixme" \
  --data @-
```

### Delete

To delete, we `POST` a copy of our resource with the extensions cleared out:

```sh
$ cat created.json  | \
jq "del(.extension)" | \
curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
  -X POST \
  -H "content-type: application/json" \
  -H "Authorization: Bearer secret-shh-fixme" \
  --data @-
```

### Query

To query, we `GET /$smart-app-state-query`, including `subject` and `code` params.

```sh
$ curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-query?subject=Patient/123&code=https://test.example.org|preferences' \
  -H "Authorization: Bearer secret-shh-fixme"
```

*(Note: this proof of concept uses Cloudflare KV storage, which is an eventually-consistent storage mechanism. You may not see changes immediately when you query.)*
