FROM postgres:15

# Set environment variables (optional)
ENV POSTGRES_DB=obsidian
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Copy init script into Docker container's init directory
COPY init.sql /docker-entrypoint-initdb.d/
