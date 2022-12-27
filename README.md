# Sourcecraft

Sourcecraft is a simple-to-use Minecraft decompiler, run on GitHub actions.

## How to Use

1. Create a repository from this template, making sure to set it as private.
2. _(Optional)_ Update `.github/workflows/decompile.yml`, setting `ONLY_INCLUDE_STABLE_VERSIONS`
   to `false`, if you wish for snapshot decompilations to be created.
3. Sourcecraft will automatically run its GitHub action periodically, generating decompiled
   Minecraft sources and pushing them to a new branch for each version.

## Why?

I often have ideas on-the-go. Whether it be how to fix a bug or how to implement a feature. If I
can't look at the sourcecode immediately, that idea is pretty much gone! I need a way to browse it
on my phone.

There are other tools that generate decompiled Minecraft sources, but they were _too configurable_
and I couldn't get them to run.

## What?

Sourcecraft uses Quiltflower, Quilt Mappings, Quilt Loom, and a Deno script to generate sources. I
will not add options for other tooling, as it goes against the point of what I am trying to do.

Sourcecraft also pulls in the latest Quilted Fabric API, so injected interfaces may be browsed.

## Disclaimer

I am not responsible for any trouble you get into using Sourcecraft. Keep the repositories private
and don't go sharing the source.
