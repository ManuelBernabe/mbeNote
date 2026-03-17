# Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /app
COPY mbeNote.sln ./
COPY src/mbeNote.Core/mbeNote.Core.csproj src/mbeNote.Core/
COPY src/mbeNote.Infrastructure/mbeNote.Infrastructure.csproj src/mbeNote.Infrastructure/
COPY src/mbeNote.Api/mbeNote.Api.csproj src/mbeNote.Api/
COPY tests/mbeNote.Tests/mbeNote.Tests.csproj tests/mbeNote.Tests/
RUN dotnet restore
COPY src/ src/
COPY tests/ tests/
RUN dotnet publish src/mbeNote.Api -c Release -o /out

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=backend-build /out .
COPY --from=frontend-build /app/frontend/dist wwwroot/
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "mbeNote.Api.dll"]
