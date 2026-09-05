# wyro-check-action

Fail a pull request that **introduces** a new architecture violation — an
unauthenticated route reaching a table, sensitive data flowing to a third party,
a public endpoint with no validator or rate limiter.

```yaml
# .github/workflows/architecture.yml
name: architecture
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: DominicPaaul7/wyro-check-action@v1
```

## Adopting it on a repository that already exists

Point a checker at an established codebase and it finds things. That number is
accurate and it is not actionable — nobody fails their own build on day one over
problems they did not introduce, so they delete the gate, and a deleted gate
catches nothing.

Record what is already there, once:

```bash
curl -fsSL https://wyro.in/wyro-check.js -o /tmp/wyro-check.js
node /tmp/wyro-check.js . --update-baseline
git add .wyro/baseline.json && git commit -m "Baseline architecture findings"
```

From that commit on, only findings **not** in the ledger fail a build. Existing
ones are carried, counted, and shown under a fold. When one stops firing, the
check says so and invites you to bank the improvement.

The ledger is keyed on the route and the table, not on the file and the line, so
reformatting a file or moving it does not resurrect a finding you accepted.

## Inputs

| Input | Default | |
| --- | --- | --- |
| `path` | `.` | Directory to check. |
| `config` | | Config file. Defaults to `wyro.json`, then `.wyro/config.json`. |
| `baseline` | | Ledger path. Defaults to `.wyro/baseline.json` when it exists. |
| `fail-on` | `error` | `error`, `warn`, or `never`. |
| `max-warnings` | | Warning budget across the repository. |
| `allow-unreadable` | `false` | Pass when nothing parses as a backend. See below. |
| `token` | | A Wyro project token — see *Central policy*. |
| `checksum` | | Pin the expected SHA-256 of the checker. |
| `source` | `https://wyro.in` | Where to fetch the checker from. |

## Exit codes

| | |
| --- | --- |
| `0` | nothing new |
| `1` | new findings that fail your threshold |
| `2` | nothing could be read as a backend |
| `3` | the gate is misconfigured and did not run |

`2` and `3` are separate from `1` on purpose. A repository that could not be
parsed produces zero findings, and zero findings must never render as a clean
bill of health — so an unreadable directory fails by default, and a package that
genuinely has no backend opts out in writing with `allow-unreadable`. A gate
that has been broken for three weeks should not look like a gate that is
catching problems.

## Central policy

With a `token`, the rules come from your project in Wyro and the repository
cannot weaken them — a `wyro.json` in the repo can make the build stricter and
cannot make it looser. Create a token in your project's **Architecture policy**
settings, store it as a repository secret, and pass it in:

```yaml
      - uses: DominicPaaul7/wyro-check-action@v1
        with:
          token: ${{ secrets.WYRO_TOKEN }}
```

If a token is supplied and the policy cannot be fetched, **the run fails**. It
does not fall back to the repository's own config — a gate that reverts to a
local file whenever the network is unhappy can be switched off by anyone who can
break the network. Teams that do not want that dependency simply do not pass a
token; the check still runs and still fails builds.

## What it is

The action is a thin wrapper. It downloads `wyro-check` from wyro.in, verifies
the SHA-256 against the digest published beside it, caches it by digest, and
runs it. The check itself is local: your source is read on your runner and never
uploaded.

The checksum verification catches a truncated transfer or a half-deployed asset.
It is honestly *not* a defence against a compromised wyro.in, since both the
bundle and the digest come from the same host — pin `checksum` if that is in
your threat model.

## Licence

MIT. See [LICENSE](LICENSE).
