package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

type ClusterPostgres struct {
	pool *pgxpool.Pool
}

func InitPool(pool_ *pgxpool.Pool) *ClusterPostgres {
	return &ClusterPostgres{pool: pool_}
}
