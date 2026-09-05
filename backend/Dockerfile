# syntax=docker/dockerfile:1
# =============================================================================
# Stage 1: Build Java Spring Boot Application
# =============================================================================
FROM eclipse-temurin:25-jdk-noble AS builder

WORKDIR /app

# Copy maven wrapper and pom.xml first for dependency caching
COPY .mvn ./.mvn
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw

# Download dependencies (offline cache layer)
RUN ./mvnw dependency:go-offline -B || true

# Copy source code and package jar
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# =============================================================================
# Stage 2: Minimal Production Runtime
# =============================================================================
FROM eclipse-temurin:25-jre-noble AS runner

WORKDIR /app

# Install curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 taskosaur && chown -R taskosaur:taskosaur /app
USER taskosaur

# Copy jar from builder
COPY --from=builder --chown=taskosaur:taskosaur /app/target/taskosaur-0.0.1-SNAPSHOT.jar ./app.jar

# Create uploads directory
RUN mkdir -p ./uploads

ENV SERVER_PORT=3000 \
    SPRING_JPA_SHOW_SQL=false

EXPOSE 3000

ENTRYPOINT ["java", "-jar", "app.jar"]
