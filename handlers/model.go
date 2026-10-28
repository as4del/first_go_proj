package handlers

import "awesomeProject/repository"

type Handler struct {
	cluster *repository.ClusterPostgres
}

func NewHandler(cluster_ *repository.ClusterPostgres) *Handler {
	return &Handler{cluster: cluster_}
}
