-- CreateEnum
CREATE TYPE "RepositoryStatus" AS ENUM ('REGISTERED', 'SYNCING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "GraphEdgeType" AS ENUM ('AUTHORED', 'MODIFIED', 'PARENT_OF', 'CONTAINS', 'HAS_COMMIT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "github_id" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repositories" (
    "id" UUID NOT NULL,
    "github_id" BIGINT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "default_branch" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "clone_url" TEXT NOT NULL,
    "size_kb" INTEGER NOT NULL,
    "language" TEXT,
    "description" TEXT,
    "status" "RepositoryStatus" NOT NULL DEFAULT 'REGISTERED',
    "registered_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_synced_at" TIMESTAMP(3),

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_snapshots" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "head_commit" TEXT NOT NULL,
    "default_branch" TEXT NOT NULL,
    "last_fetched_at" TIMESTAMP(3) NOT NULL,
    "last_analyzed_commit" TEXT,
    "commit_count" INTEGER NOT NULL,
    "analysis_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commit_events" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "parent_hashes" JSONB NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "authored_at" TIMESTAMP(3) NOT NULL,
    "committed_at" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developers" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "developers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_nodes" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commit_nodes" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "authored_at" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commit_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_edges" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "type" "GraphEdgeType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_results" (
    "id" UUID NOT NULL,
    "repository_id" UUID NOT NULL,
    "metric_name" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_github_id_key" ON "users"("github_id");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_github_id_key" ON "repositories"("github_id");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_full_name_key" ON "repositories"("full_name");

-- CreateIndex
CREATE INDEX "repositories_registered_by_id_idx" ON "repositories"("registered_by_id");

-- CreateIndex
CREATE INDEX "repositories_status_idx" ON "repositories"("status");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_owner_name_key" ON "repositories"("owner", "name");

-- CreateIndex
CREATE INDEX "repository_snapshots_repository_id_idx" ON "repository_snapshots"("repository_id");

-- CreateIndex
CREATE UNIQUE INDEX "commit_events_hash_key" ON "commit_events"("hash");

-- CreateIndex
CREATE INDEX "commit_events_repository_id_idx" ON "commit_events"("repository_id");

-- CreateIndex
CREATE INDEX "commit_events_committed_at_idx" ON "commit_events"("committed_at");

-- CreateIndex
CREATE UNIQUE INDEX "developers_email_key" ON "developers"("email");

-- CreateIndex
CREATE INDEX "developers_email_idx" ON "developers"("email");

-- CreateIndex
CREATE INDEX "file_nodes_repository_id_idx" ON "file_nodes"("repository_id");

-- CreateIndex
CREATE UNIQUE INDEX "file_nodes_repository_id_path_key" ON "file_nodes"("repository_id", "path");

-- CreateIndex
CREATE UNIQUE INDEX "commit_nodes_hash_key" ON "commit_nodes"("hash");

-- CreateIndex
CREATE INDEX "commit_nodes_repository_id_idx" ON "commit_nodes"("repository_id");

-- CreateIndex
CREATE INDEX "commit_nodes_hash_idx" ON "commit_nodes"("hash");

-- CreateIndex
CREATE INDEX "graph_edges_type_idx" ON "graph_edges"("type");

-- CreateIndex
CREATE INDEX "graph_edges_repository_id_idx" ON "graph_edges"("repository_id");

-- CreateIndex
CREATE INDEX "graph_edges_source_id_idx" ON "graph_edges"("source_id");

-- CreateIndex
CREATE INDEX "graph_edges_target_id_idx" ON "graph_edges"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "graph_edges_source_id_target_id_type_key" ON "graph_edges"("source_id", "target_id", "type");

-- CreateIndex
CREATE INDEX "metric_results_repository_id_idx" ON "metric_results"("repository_id");

-- CreateIndex
CREATE INDEX "metric_results_metric_name_idx" ON "metric_results"("metric_name");

-- CreateIndex
CREATE INDEX "metric_results_entity_id_idx" ON "metric_results"("entity_id");

-- AddForeignKey
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_registered_by_id_fkey" FOREIGN KEY ("registered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commit_events" ADD CONSTRAINT "commit_events_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_nodes" ADD CONSTRAINT "file_nodes_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commit_nodes" ADD CONSTRAINT "commit_nodes_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_results" ADD CONSTRAINT "metric_results_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
