package repository

import (
	"awesomeProject/structs"
	"context"
	"errors"
	"time"
)

func (h *ClusterPostgres) AddToBase(in *structs.Link) error {
	ctx1, cancel1 := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel1()
	var ex bool
	err1 := h.pool.QueryRow(ctx1,
		`SELECT EXISTS(
            SELECT 1 FROM links WHERE short_code = $1
        )`, in.ShortUrl).Scan(&ex)

	if err1 != nil {
		return err1
	}
	if ex {
		return errors.New("URL already exist")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err := h.pool.Exec(ctx,
		`INSERT INTO links (username, short_code, original_url)
VALUES ($1, $2, $3)`,
		in.Username,
		in.ShortUrl,
		in.OriginalUrl,
	)
	if err != nil {
		return err
	}

	return nil
}
