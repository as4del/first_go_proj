package handlers

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

func (h *Handler) Me(c *gin.Context) {
	session := sessions.Default(c)
	user, ok := session.Get("username").(string)

	if !ok || user == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"username": user,
	})
}
