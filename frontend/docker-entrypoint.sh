#!/bin/sh

# Replace __ENV_VARIABLE__ placeholders in the app
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

exec "$@"