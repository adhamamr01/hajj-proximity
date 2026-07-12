# Local Android build environment for `eas build --local`.
# EAS's local build only supports macOS/Linux — this container satisfies
# that on Windows via Docker Desktop's Linux containers, without needing
# WSL package installs on the host.
FROM eclipse-temurin:21-jdk-jammy

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl unzip git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Node 22 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# Android SDK command-line tools + the components this project needs
# (versions match what the EAS cloud build log showed: build-tools 36.1.0,
# platform android-36; NDK is downloaded automatically by Gradle at build
# time once the SDK license is accepted).
RUN mkdir -p "${ANDROID_HOME}/cmdline-tools" \
  && curl -fsSL -o /tmp/cmdline-tools.zip \
       https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
  && unzip -q /tmp/cmdline-tools.zip -d "${ANDROID_HOME}/cmdline-tools" \
  && mv "${ANDROID_HOME}/cmdline-tools/cmdline-tools" "${ANDROID_HOME}/cmdline-tools/latest" \
  && rm /tmp/cmdline-tools.zip \
  && yes | sdkmanager --licenses > /dev/null \
  && sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.1.0"

RUN npm install -g eas-cli

WORKDIR /app
