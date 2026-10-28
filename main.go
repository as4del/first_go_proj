package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"awesomeProject/handlers"
	"awesomeProject/repository"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	server := gin.Default()
	server.Static("/app", "./frontend")
	server.StaticFile("/", "./frontend/index.html")

	if err := godotenv.Load(); err != nil {
		log.Fatal(err)
	}

	databaseUrl := os.Getenv("DATABASE_URL")
	pool, err := pgxpool.New(
		context.Background(),
		databaseUrl)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	repo := repository.InitPool(pool)
	handler := handlers.NewHandler(repo)

	secret := cookie.NewStore([]byte(os.Getenv("SECRET_CODE")))
	server.Use(sessions.Sessions("main_ses", secret))

	secret.Options(sessions.Options{
		Path:     "/",
		MaxAge:   3600,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})

	server.POST("/login", handler.Login)
	server.GET("/logout", handler.Logout)
	server.GET("/api/me", handler.Me)
	server.GET("/url_for_user", handler.UrlForUser)
	server.POST("/new_user", handler.AddUser)
	server.POST("/new_url", handler.Post_curl)
	server.GET("/get/:name", handler.Get_url)

	if err := server.Run(":8080"); err != nil {
		log.Fatal(err)
	}

}
