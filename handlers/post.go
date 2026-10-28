package handlers

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"

	"awesomeProject/structs"
)

func (h *Handler) Post_curl(c *gin.Context) {
	var Link structs.Link

	if err := c.ShouldBindJSON(&Link); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	session := sessions.Default(c)
	user, ok := session.Get("username").(string)

	if !ok || user == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Unauthorized",
		})
		return
	}

	Link.Username = user

	if err := h.cluster.AddToBase(&Link); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusCreated)
}
