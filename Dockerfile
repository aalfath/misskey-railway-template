# Misskey on Railway: the official image, pinned by version and digest.
# Bump the tag and digest together, and add a CHANGELOG.md entry.
FROM misskey/misskey:2026.11.0@sha256:308f8f1980ae2e7d43209923190dcbbdbece428a0fb1c22060d3576d7bcd2d69

# The wrapper starts as root only to write the config and fix the volume's
# ownership, then drops to the image's own misskey user (uid 991).
USER root
COPY --chmod=0755 railway-entrypoint.sh /usr/local/bin/railway-entrypoint.sh
COPY --chmod=0644 write-config.mjs /usr/local/lib/railway/write-config.mjs

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/railway-entrypoint.sh"]
CMD ["node", "scripts/start.mjs", "--migrate"]
