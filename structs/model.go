package structs

type Link struct {
	Username    string `json:"username"`
	ShortUrl    string `json:"short" binding:"required"`
	OriginalUrl string `json:"original" binding:"required"`
}

type User struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type User2 struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}
