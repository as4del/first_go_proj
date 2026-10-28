package repository

import (
	"context"
	"errors"
	"time"
)

func (h *ClusterPostgres) LogUser(username string, password string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var ex1 bool

	err := h.pool.QueryRow(ctx, `SELECT EXISTS(
            SELECT 1 FROM users WHERE username = $1 AND password_hash = $2
        )`, username, password).Scan(&ex1)

	if err != nil {
		return false, err
	}

	if ex1 {
		return true, nil
	}
	return false, nil
}

func (h *ClusterPostgres) Userexist(username string, email string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var ex1 bool

	err1 := h.pool.QueryRow(ctx, `SELECT EXISTS(
            SELECT 1 FROM users WHERE username = $1
        )`, username).Scan(&ex1)
	if err1 != nil {
		return err1
	}

	var ex2 bool

	err2 := h.pool.QueryRow(ctx, `SELECT EXISTS(
            SELECT 1 FROM users WHERE email = $1
        )`, email).Scan(&ex2)
	if err2 != nil {
		return err2
	}

	if ex1 && ex2 {
		return errors.New("Username and email already exist")
	} else if ex1 {
		return errors.New("Username already exist")
	} else if ex2 {
		return errors.New("Email already exist")
	} else {
		return nil
	}

}

func (h *ClusterPostgres) AddUser(username string, email string, password string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := h.pool.Exec(ctx,
		"INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)", username, email, password)
	if err != nil {
		return err
	}
	return nil
}
