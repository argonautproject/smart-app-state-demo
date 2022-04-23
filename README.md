# Demo implementation for `$smart-app-state` operations

Details at https://hackmd.io/@argonaut/smart-app-state


## Examples

### Create

To create, we `POST /$smart-app-state-modify`, submitting a `Basic` resource with a subject (answering the question: "with whose record or account is this state associated?"), a single code (answering the question: "what kind of state is this?"). Our actual state data is conveyed in top-level non-complex extensions:


```sh

$ echo '{
  "resourceType": "Basic",
  "subject": {
    "reference": "Patient/RANDOM"
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
jq ".subject.reference |= sub(\"RANDOM\"; $RANDOM|tostring)" | \
curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
--request POST \
--header "content-type: application/json" \
--header "Authorization: Bearer secret-shh-fixme" \
--data @- \
> created.json
```


### Update

To update, we `POST` a copy of the resource where our extensions change, and everything else stays the same:

```sh
$ cat created.json  | \
jq '.extension = [{"url": "https://test.example.org", "valueString": "purple"}]' | \
curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
--request POST \
--header "content-type: application/json" \
--header "Authorization: Bearer secret-shh-fixme" \
--data @-
```

### Delete

To delete, we `POST` a copy of our resource with the extensions cleared out:

```sh
$ cat created.json  | \
jq "del(.extension)" | \
curl -s 'https://smart-app-state.argonaut.workers.dev/$smart-app-state-modify' \
--request POST \
--header "content-type: application/json" \
--header "Authorization: Bearer secret-shh-fixme" \
--data @-
```

### Query

To query, we `GET /$smart-app-state-query`, including `subject` and `code` as query params:

```sh
$ curl -s --get 'https://smart-app-state.argonaut.workers.dev' \
--header "Authorization: Bearer secret-shh-fixme" \
--data-urlencode "subject=Patient/123" \
--data-urlencode "code=https://test.example.org|preferences"
```

*(Note: this proof of concept uses Cloudflare KV storage, which is an eventually-consistent storage mechanism. You may not see changes immediately when you query.)*
