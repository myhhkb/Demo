package main

import "testing"

func TestCalculateBaseFee(t *testing.T) {
	tests := []struct {
		name  string
		usage float64
		want  float64
	}{
		{name: "first tier", usage: 100, want: 50},
		{name: "second tier edge", usage: 200, want: 100},
		{name: "second tier cross", usage: 300, want: 180},
		{name: "third tier cross", usage: 500, want: 380},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateBaseFee(tt.usage)
			if got != tt.want {
				t.Fatalf("CalculateBaseFee(%v) = %v, want %v", tt.usage, got, tt.want)
			}
		})
	}
}

func TestIsPeakHour(t *testing.T) {
	tests := []struct {
		hour int
		want bool
	}{
		{hour: 7, want: false},
		{hour: 8, want: true},
		{hour: 14, want: true},
		{hour: 21, want: true},
		{hour: 22, want: false},
	}

	for _, tt := range tests {
		got := IsPeakHour(tt.hour)
		if got != tt.want {
			t.Fatalf("IsPeakHour(%d) = %v, want %v", tt.hour, got, tt.want)
		}
	}
}

func TestCalculateFinalFee(t *testing.T) {
	tests := []struct {
		name string
		usage float64
		hour int
		want float64
	}{
		{name: "peak hour", usage: 400, hour: 14, want: 286},
		{name: "off peak hour", usage: 400, hour: 23, want: 208},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateFinalFee(tt.usage, tt.hour)
			if got != tt.want {
				t.Fatalf("CalculateFinalFee(%v, %d) = %v, want %v", tt.usage, tt.hour, got, tt.want)
			}
		})
	}
}
