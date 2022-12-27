// import { $ } from "npm:zx";
import { build$, CommandBuilder } from "https://deno.land/x/dax@0.17.0/mod.ts";

const loaderVersion: string = await fetch(
  "https://meta.quiltmc.org/v3/versions/loader",
).then((res) => res.json()).then((json) => json[0].version);
const gameVersions = await fetch(
  "https://meta.quiltmc.org/v3/versions/game",
).then((res) => res.json());

const ONLY_INCLUDE_STABLE_VERSIONS =
  (Deno.env.get("ONLY_INCLUDE_STABLE_VERSIONS") || "true") === "true";
const IGNORED_VERSIONS = (Deno.env.get("IGNORED_VERSIONS")?.split(",") || [])
  .map((version) => version.trim());
const DECOMPILE_VERSIONS =
  (Deno.env.get("DECOMPILE_VERSIONS")?.split(",").map((version) => version.trim()) || (await fetch(
    "https://meta.quiltmc.org/v3/versions/quilt-mappings",
  ).then((res) => res.json())).filter((version: { gameVersion: string }) => {
    if (ONLY_INCLUDE_STABLE_VERSIONS && !IGNORED_VERSIONS.includes(version.gameVersion)) {
      return gameVersions.find((findVersion: { version: string }) =>
        findVersion.version === version.gameVersion
      )?.stable;
    } else {
      return !IGNORED_VERSIONS.includes(version.gameVersion);
    }
  })).sort((a: { gameVersion: string }, b: { gameVersion: string }) => {
    return b.gameVersion.localeCompare(a.gameVersion);
  });

const builder = new CommandBuilder().quiet("stdout").cwd(Deno.cwd())
  .printCommand();
const $ = build$({ commandBuilder: builder });

interface Version {
  gameVersion: string;
  mappingsVersion: string;
  loaderVersion: string;
  quiltedFabricApiVersion: string;
}

const versions: Version[] = (await Promise.all(
  DECOMPILE_VERSIONS
    .filter(
      (version: { gameVersion: string }, index: number) =>
      DECOMPILE_VERSIONS.findIndex(
          (findVersion: { gameVersion: string }) =>
            findVersion.gameVersion === version.gameVersion,
        ) === index,
    )
    .map(
      async (metaVersion: { gameVersion: string; version: string }) => {
        const { gameVersion, version: mappingsVersion } = metaVersion;

        //TODO: Modrinth user agent
        const quiltedFabricApiVersion = await fetch(
          `https://api.modrinth.com/v2/project/qsl/version?loaders=["quilt"]&game_versions=["${gameVersion}"]`,
        ).then((res) => res.json()).then((json) =>
          json[0]?.version_number || undefined
        );

        if (quiltedFabricApiVersion === undefined) {
          console.warn(
            `No version of Quilted Fabric API for ${gameVersion} found`,
          );
          return;
        }

        return {
          gameVersion,
          mappingsVersion,
          loaderVersion,
          quiltedFabricApiVersion,
        };
      },
    ),
)).filter((version) => version !== undefined);

console.log(`Found ${versions.length} versions to decompile.`);

const tempDir = await Deno.makeTempDir();
const mainBranch: string = await $`git branch --show-current`.text();

for (
  const { gameVersion, mappingsVersion, loaderVersion, quiltedFabricApiVersion }
    of versions
) {
  console.log(`Updating sources for ${gameVersion}`);
  await $`${Deno.cwd()}/gradlew genSources -Dminecraft_version=${gameVersion} -Dloader_version=${loaderVersion} -Dmappings_version=${mappingsVersion} -Dqfapi_version=${quiltedFabricApiVersion}`;

  const sourcesDir = `${gameVersion}/org.quiltmc.quilt-mappings.${
    gameVersion.replaceAll(".", "_")
  }.${mappingsVersion}-v2`;
  const sources = `${sourcesDir}/minecraft-project-@-merged-named-sources.jar`;
  await Deno.mkdir(`${tempDir}/${sourcesDir}`, { recursive: true });
  await Deno.copyFile(
    `${Deno.cwd()}/.gradle/quilt-loom-cache/${sources}`,
    `${tempDir}/${sources}`,
  );

  await $`git checkout ${gameVersion} || git checkout -b ${gameVersion}`;
  for await (const file of $.fs.expandGlob(`${Deno.cwd()}/*`)) {
    if (file.path === `${Deno.cwd()}/.git`) continue;
    await Deno.remove(file.path, { recursive: true });
  }

  await $`unzip ${tempDir}/${sources} -d .`;
  await $`git add .`;
  await $.raw`git commit -m "[Sourcecraft Bot | ${
    new Date().toLocaleDateString()
  }] Update sources for ${gameVersion}"`;
  await $`git push origin ${gameVersion} --force`;
  await $`git checkout ${mainBranch}`;

  try {
    await Deno.remove("./.gradle");
    await Deno.remove("./build");
    // deno-lint-ignore no-empty
  } catch (_) {
  }
}

await Deno.remove(tempDir, { recursive: true });
await $`git checkout ${mainBranch}`;
