/**
 * Expo config plugin that fixes Android build issues on Windows.
 *
 * 1. gradle.properties — injects WindowsSelectorProvider to fix JDK 17 loopback
 * 2. gradlew.bat       — same flag for the Gradle wrapper/launcher process
 * 3. local.properties  — writes sdk.dir so builds work after `prebuild --clean`
 * 4. expo-modules-core  — fixes bare `-D_LIBCPP_ENABLE_EXPERIMENTAL_FORMAT` flag
 * 5. CMake 3.31.6       — forced everywhere (3.22.1 can't parse bare -D flags)
 * 6. react-native-screens — fix missing STL link in CMakeLists.txt
 *
 * Applied automatically on every `expo prebuild`.
 */
const { withGradleProperties, withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const SELECTOR_FLAG =
  "-Djava.nio.channels.spi.SelectorProvider=sun.nio.ch.WindowsSelectorProvider";

/** 1. Patch gradle.properties via the standard Expo API */
const withGradlePropertiesFix = (config) =>
  withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const existing = props.find(
      (p) => p.type === "property" && p.key === "org.gradle.jvmargs"
    );
    if (existing) {
      if (!existing.value.includes(SELECTOR_FLAG)) {
        existing.value = `${existing.value} ${SELECTOR_FLAG}`;
      }
    } else {
      props.push({
        type: "property",
        key: "org.gradle.jvmargs",
        value: `-Xmx2048m -XX:MaxMetaspaceSize=512m ${SELECTOR_FLAG}`,
      });
    }
    return cfg;
  });

/** 2. Patch gradlew.bat DEFAULT_JVM_OPTS */
const withGradlewBatFix = (config) =>
  withDangerousMod(config, [
    "android",
    (cfg) => {
      const batPath = path.join(cfg.modRequest.platformProjectRoot, "gradlew.bat");
      if (!fs.existsSync(batPath)) return cfg;
      let content = fs.readFileSync(batPath, "utf8");
      if (!content.includes(SELECTOR_FLAG)) {
        content = content.replace(
          /^(set DEFAULT_JVM_OPTS=.*)$/m,
          `$1 "${SELECTOR_FLAG}"`
        );
        fs.writeFileSync(batPath, content, "utf8");
      }
      return cfg;
    },
  ]);

/** 3. Write local.properties with sdk.dir so builds work after prebuild --clean */
const withLocalProperties = (config) =>
  withDangerousMod(config, [
    "android",
    (cfg) => {
      let sdkDir = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
      if (!sdkDir) {
        const defaultDir = path.join(
          process.env.LOCALAPPDATA || "",
          "Android",
          "Sdk"
        );
        if (!fs.existsSync(defaultDir)) return cfg;
        sdkDir = defaultDir;
      }
      const propsPath = path.join(cfg.modRequest.platformProjectRoot, "local.properties");
      const escaped = sdkDir.replace(/\\/g, "\\\\");
      fs.writeFileSync(propsPath, `sdk.dir=${escaped}\n`, "utf8");
      return cfg;
    },
  ]);

/**
 * 4-6. Fix native module build issues.
 *
 * - expo-modules-core: bare `-D_LIBCPP_ENABLE_EXPERIMENTAL_FORMAT` → add `=1`
 * - All native modules + app: force CMake 3.31.6
 * - react-native-screens: add missing `c++_shared` link to fix NDK 27 linker errors
 */
const withNativeModuleFixes = (config) =>
  withDangerousMod(config, [
    "android",
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;

      // --- expo-modules-core ---
      const expoCoreBuildGradle = path.join(
        projectRoot, "node_modules", "expo-modules-core", "android", "build.gradle"
      );
      if (fs.existsSync(expoCoreBuildGradle)) {
        let content = fs.readFileSync(expoCoreBuildGradle, "utf8");
        content = content.replace(
          '"-D_LIBCPP_ENABLE_EXPERIMENTAL_FORMAT"',
          '"-D_LIBCPP_ENABLE_EXPERIMENTAL_FORMAT=1"'
        );
        content = content.replace(
          /cmake\s*\{\s*\n(\s*)path\s+"CMakeLists\.txt"\s*\n(\s*)\}/,
          'cmake {\n$1path "CMakeLists.txt"\n$1version "3.31.6"\n$2}'
        );
        fs.writeFileSync(expoCoreBuildGradle, content, "utf8");
      }

      // Fix expo-modules-core CMakeLists: add c++_shared to link libraries
      const expoCoreCMake = path.join(
        projectRoot, "node_modules", "expo-modules-core", "android", "cmake", "common.cmake"
      );
      if (fs.existsSync(expoCoreCMake)) {
        let content = fs.readFileSync(expoCoreCMake, "utf8");
        const marker = "# [withWindowsGradleFix]";
        if (!content.includes(marker)) {
          // Add c++_shared to the EXPO_COMMON interface link libraries
          content = content.replace(
            /(target_link_libraries\(\s*\n\s*EXPO_COMMON\s*\n\s*INTERFACE\s*\n\s*ReactAndroid::jsi\s*\n\s*fbjni::fbjni\s*\n\s*ReactAndroid::reactnative\s*\n\s*\))/,
            `$1\n\n${marker} Fix NDK 27 STL linkage on Windows\ntarget_link_libraries(EXPO_COMMON INTERFACE c++_shared)`
          );
          fs.writeFileSync(expoCoreCMake, content, "utf8");
        }
      }

      // Also fix variables.cmake bare -D flag
      const variablesCmake = path.join(
        projectRoot, "node_modules", "expo-modules-core", "android", "cmake", "variables.cmake"
      );
      if (fs.existsSync(variablesCmake)) {
        let content = fs.readFileSync(variablesCmake, "utf8");
        content = content.replace(
          "-D_LIBCPP_ENABLE_EXPERIMENTAL_FORMAT)",
          "-D_LIBCPP_ENABLE_EXPERIMENTAL_FORMAT=1)"
        );
        fs.writeFileSync(variablesCmake, content, "utf8");
      }

      // --- react-native-screens ---
      // Force CMake version in build.gradle
      const screensBuildGradle = path.join(
        projectRoot, "node_modules", "react-native-screens", "android", "build.gradle"
      );
      if (fs.existsSync(screensBuildGradle)) {
        let content = fs.readFileSync(screensBuildGradle, "utf8");
        content = content.replace(
          /cmake\s*\{\s*\n(\s*)path\s+"CMakeLists\.txt"\s*\n(\s*)\}/,
          'cmake {\n$1path "CMakeLists.txt"\n$1version "3.31.6"\n$2}'
        );
        fs.writeFileSync(screensBuildGradle, content, "utf8");
      }

      // Fix CMakeLists.txt: add c++_shared to link libraries for NDK 27 compat
      const screensCMakeLists = path.join(
        projectRoot, "node_modules", "react-native-screens", "android", "CMakeLists.txt"
      );
      if (fs.existsSync(screensCMakeLists)) {
        let content = fs.readFileSync(screensCMakeLists, "utf8");
        const marker = "# [withWindowsGradleFix]";
        if (!content.includes(marker)) {
          // Add c++_shared to both new arch and old arch link targets
          content = content.replace(
            /(target_link_libraries\(rnscreens\s*\n\s*ReactAndroid::reactnative\s*\n\s*ReactAndroid::jsi\s*\n\s*fbjni::fbjni\s*\n\s*android\s*\n\s*\))/,
            `$1\n${marker} Fix NDK 27 STL linkage\ntarget_link_libraries(rnscreens c++_shared)`
          );
          fs.writeFileSync(screensCMakeLists, content, "utf8");
        }
      }

      // Fix codegen CMakeLists for all native modules — add c++_shared link.
      // These are under node_modules/<pkg>/android/src/main/jni/CMakeLists.txt
      const codegenModules = [
        "react-native-screens",
        "react-native-safe-area-context",
        "react-native-svg",
        "@react-native-async-storage/async-storage",
      ];
      for (const mod of codegenModules) {
        const codegenCMake = path.join(
          projectRoot, "node_modules", mod, "android", "src", "main", "jni", "CMakeLists.txt"
        );
        if (fs.existsSync(codegenCMake)) {
          let content = fs.readFileSync(codegenCMake, "utf8");
          const marker = "# [withWindowsGradleFix]";
          if (!content.includes(marker)) {
            // Extract the target name from the file — it's set as LIB_TARGET_NAME or the project name
            // Find the target name used in target_link_libraries
            const linkMatch = content.match(/target_link_libraries\(\s*(\$\{[^}]+\}|\S+)/);
            if (linkMatch) {
              content += `\n${marker} Fix NDK 27 STL linkage\ntarget_link_libraries(${linkMatch[1]} c++_shared)\n`;
            }
            fs.writeFileSync(codegenCMake, content, "utf8");
          }
        }
      }

      // --- app build.gradle ---
      const appBuildGradle = path.join(
        cfg.modRequest.platformProjectRoot, "app", "build.gradle"
      );
      if (fs.existsSync(appBuildGradle)) {
        let content = fs.readFileSync(appBuildGradle, "utf8");
        const marker = "// [withWindowsGradleFix] Force CMake version";
        if (!content.includes(marker)) {
          content = content.replace(
            /(ndkVersion\s+rootProject\.ext\.ndkVersion)/,
            `$1\n\n    ${marker}\n    externalNativeBuild {\n        cmake {\n            version "3.31.6"\n        }\n    }`
          );
          fs.writeFileSync(appBuildGradle, content, "utf8");
        }
      }

      return cfg;
    },
  ]);

module.exports = (config) =>
  withNativeModuleFixes(withLocalProperties(withGradlewBatFix(withGradlePropertiesFix(config))));
