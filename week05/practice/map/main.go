package main
import "fmt"
func frequencyMap(s string) map[rune]int {
	m := make(map[rune]int)
	for _, r := range s {
		m[r]++
	}
	return m
}
func mostFrequentChar(s string, freq map[rune]int) (rune, int) {
	if len(freq) == 0 {
		return 0, 0
	}
	max := 0
	for _, n := range freq {
		if n > max {
			max = n
		}
	}
	for _, r := range s {
		if freq[r] == max {
			return r, max
		}
	}
	return 0, 0
}
func main() {
	s := "a1b2c3a1b2a1" 
	freq := frequencyMap(s)
	fmt.Println("各字符出现次数:")
	for r, n := range freq {
		fmt.Printf("  %q -> %d\n", r, n)
	}
	top, cnt := mostFrequentChar(s, freq)
	fmt.Printf("出现次数最多的字符: %q，共 %d 次\n", top, cnt)
}
