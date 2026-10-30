# SDK release procedure

This SDK is implemented locally and remains unpublished. Registry coordinates in
package metadata are proposed until account/repository ownership is confirmed.
Use the independent repository's SemVer and tag v<version>; the current candidate
is 1.0.0 and supported API prefix is v1. Patch fixes remain compatible, additive
features are minor, breaking SDK behavior is major after the first published
release. API route versioning is a separate decision. Do not publish automatically.

Run `python3 scripts/check-release.py` to compare package metadata, version constants
and a CI tag, then run the native checks below on the documented supported runtime:

```text
npm ci; npm run typecheck; npm test; npm run build; npm audit --audit-level=high; npm pack --dry-run
```

The checked-in CI workflow runs verification only, with read-only repository
permissions. Capture runtime dependency advisories/licenses and package contents;
no successful compiler/test run replaces that review. Custom HTTP clients/handlers
must refuse redirects so X-API-Key stays on the configured origin. API keys must
never appear in browser code, package files, examples, logs or public CI artifacts.

Review the README/GUIDE/API-key-only OpenAPI snapshot, changelog, MIT LICENSE,
package payload and version/User-Agent consistency. Test upload/transform/download,
PDF binary versus multiple-page results and structured errors against designated
disposable smoke data. Publishing credentials, package namespace ownership and
registry-specific signatures/attestations must be approved before publication.
Java Maven Central also requires the registry's source/javadoc/signing metadata;
a local verified JAR is not evidence of registry acceptance.

The workspace SDK directory currently resolves to an ignored parent repository;
import this source into its own reviewed Git repository before release tags or
CI publication. Record exact source revision, artifact hash, native check results
and supported API versions. Never rebuild a moving branch for promotion. If a
published version fails, deprecate/yank it according to registry policy and release
a reviewed patch; do not overwrite an existing version. No publication, tag or
repository initialization occurs in this audit.
