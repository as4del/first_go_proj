package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Get_url(c *gin.Context) {
	link := c.Param("name")

	res, err := h.cluster.GetFromBase(link)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err})
		return
	}

	c.Redirect(http.StatusFound, res)
}
