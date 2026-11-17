#!/bin/sh
# Writes /misskey/.config/default.yml from Railway variables, makes sure the
# Drive volume belongs to the misskey user, then starts Misskey as that user.
set -eu

FILES_DIR=/misskey/files
mkdir -p /misskey/.config "$FILES_DIR"
rm -rf "$FILES_DIR/lost+found"

# Volumes are mounted root-owned; Misskey runs as uid 991.
if [ "$(stat -c %u "$FILES_DIR")" != "991" ]; then
  chown -R 991:991 "$FILES_DIR"
fi

node /usr/local/lib/railway/write-config.mjs
chown -R 991:991 /misskey/.config
chmod 600 /misskey/.config/default.yml

export HOME=/misskey
exec setpriv --reuid=misskey --regid=misskey --init-groups "$@"
