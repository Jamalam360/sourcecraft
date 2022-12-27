plugins {
    id("org.quiltmc.loom") version "1.0.+"
}

val versions = mapOf(
        Pair("minecraft", System.getProperty("minecraft_version")),
        Pair("mappings", System.getProperty("mappings_version")),
        Pair("loader", System.getProperty("loader_version")),
        Pair("qfapi", System.getProperty("qfapi_version")),
)

for (entry in versions) {
    if (entry.value == null) throw Exception("${entry.key} version not found.")
}

dependencies {
    minecraft("com.mojang:minecraft:${versions["minecraft"]}")
    mappings("org.quiltmc:quilt-mappings:${versions["mappings"]}:intermediary-v2")
    modImplementation("org.quiltmc:quilt-loader:${versions["loader"]}")
    modImplementation("org.quiltmc.quilted-fabric-api:quilted-fabric-api:${versions["qfapi"]}")
}
