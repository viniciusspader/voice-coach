/**
 * Expo config plugin that ensures Gradle uses WindowsSelectorProvider on Windows.
 *
 * JDK 17 on Windows 11 defaults to WEPollSelectorProvider which uses Unix Domain
 * Sockets for its internal Pipe implementation. These fail under Git Bash / MSYS
 * and in certain Windows environments, causing "Unable to establish loopback
 * connection" when Gradle tries to connect the wrapper to the daemon.
 *
 * This plugin injects the fix into both:
 *   - gradle.properties  (org.gradle.jvmargs — applies to the Gradle daemon)
 *   - gradlew.bat        (DEFAULT_JVM_OPTS — applies to the Gradle wrapper/launcher)
 *
 * Applied automatically on every `expo prebuild`, so manual edits to those files
 * are not needed.
 */
const { withGradleProperties, withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const SELECTOR_FLAG =
  "-Djava.nio.channels.spi.SelectorProvider=sun.nio.ch.WindowsSelectorProvider";

/** Patch gradle.properties via the standard Expo API */
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

/** Patch gradlew.bat DEFAULT_JVM_OPTS via file manipulation */
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

module.exports = (config) => withGradlewBatFix(withGradlePropertiesFix(config));
