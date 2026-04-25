package models

type Student struct {
	ID    int    `json:"id" binding:"required"`
	Name  string `json:"name" binding:"required"`
	Age   int    `json:"age" binding:"required"`
	Grade string `json:"grade" binding:"required"`
}

type UpdateStudentRequest struct {
	Name  string `json:"name" binding:"required"`
	Age   int    `json:"age" binding:"required"`
	Grade string `json:"grade" binding:"required"`
}
