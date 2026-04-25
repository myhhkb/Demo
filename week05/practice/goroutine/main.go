package main

import (
	"fmt"
	"time"
)

const (
	dataSize   = 10000
	sleepAfter = time.Millisecond * 5
)

func main() {
	nums := buildData(dataSize)
	expected := formulaSumSquares(dataSize - 1)

	sum10000, d10000 := timedConcurrentSquareSum(nums, 10000)
	sum10, d10 := timedConcurrentSquareSum(nums, 10)

	fmt.Printf("理论平方和: %d\n", expected)
	fmt.Printf("10000个协程结果: %d, 是否正确: %t\n", sum10000, sum10000 == expected)
	fmt.Printf("10个协程结果: %d, 是否正确: %t\n", sum10, sum10 == expected)
	fmt.Printf("10000个协程耗时: %v\n", d10000)
	fmt.Printf("10个协程耗时: %v\n", d10)
	if d10000 > 0 {
		fmt.Printf("耗时对比(10协程/10000协程): %.2fx\n", float64(d10)/float64(d10000))
	}
}

func buildData(n int) []int {
	nums := make([]int, n)
	for i := 0; i < n; i++ {
		nums[i] = i
	}
	return nums
}

// concurrentSquareSum 按 goroutineCount 分块并发计算平方和。
func concurrentSquareSum(nums []int, goroutineCount int) int64 {
	if len(nums) == 0 || goroutineCount <= 0 {
		return 0
	}

	if goroutineCount > len(nums) {
		goroutineCount = len(nums)
	}

	chunkSize := (len(nums) + goroutineCount - 1) / goroutineCount
	resultCh := make(chan int64, goroutineCount)

	launched := 0
	for start := 0; start < len(nums); start += chunkSize {
		end := start + chunkSize
		if end > len(nums) {
			end = len(nums)
		}
		launched++

		go func(part []int) {
			var partial int64
			for _, v := range part {
				partial += int64(v) * int64(v)
			}
			time.Sleep(sleepAfter)
			resultCh <- partial
		}(nums[start:end])
	}

	var total int64
	for i := 0; i < launched; i++ {
		total += <-resultCh
	}
	return total
}

func timedConcurrentSquareSum(nums []int, goroutineCount int) (int64, time.Duration) {
	start := time.Now()
	sum := concurrentSquareSum(nums, goroutineCount)
	return sum, time.Since(start)
}

// formulaSumSquares 使用公式 1^2 + ... + n^2 = n(n+1)(2n+1)/6。
func formulaSumSquares(n int) int64 {
	x := int64(n)
	return x * (x + 1) * (2*x + 1) / 6
}
