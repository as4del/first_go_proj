package repository

import (
	"awesomeProject/structs"
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

func (h *ClusterPostgres) GetFromBase(link string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var result string
	err := h.pool.QueryRow(ctx,
		`SELECT original_url FROM links WHERE short_code = $1`, link).Scan(&result)

	if errors.Is(err, pgx.ErrNoRows) {
		return "", errors.New("Url doesnt exist")
	}

	if err != nil {
		return "", err
	}

	return result, nil
}

func (h *ClusterPostgres) GetFromBaseByUsername(user string) ([]structs.Link, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := h.pool.Query(ctx,
		`SELECT username, short_code, original_url FROM links WHERE username = $1`, user)
	if err != nil {
		return []structs.Link{}, err
	}
	defer res.Close()

	links := make([]structs.Link, 0)

	for res.Next() {
		var link structs.Link

		if err := res.Scan(
			&link.Username,
			&link.ShortUrl,
			&link.OriginalUrl,
		); err != nil {
			return nil, err
		}

		links = append(links, link)
	}

	if err := res.Err(); err != nil {
		return nil, err
	}

	return links, nil
}
