package main

import "fmt"

func main() {
	slice1 := []int{1, 2, 3, 4}
	slice2 := []int{3, 4, 5, 6}

	combinedSlice := append(slice1, slice2...)

	uniqueSlice := make([]int, 0, len(combinedSlice))
	for _, v := range combinedSlice {
		found := false
		for _, u := range uniqueSlice {
			if u == v {
				found = true
				break
			}
		}
		if !found {
			uniqueSlice = append(uniqueSlice, v)
		}
	}

	fmt.Println(uniqueSlice)
}
