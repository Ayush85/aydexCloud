package main

import (
	"net/http"
	"os"
	"testing"
)

func TestCleanReferrer(t *testing.T) {
	cases := map[string]string{
		"":                                      "",
		"https%3A%2F%2Fwww.google.com%2Fsearch": "google.com",
		"https%3A%2F%2Ftwitter.com%2Fhome":       "twitter.com",
		"not a url":                              "",
		"%zz":                                    "", // invalid percent-encoding
	}
	for in, want := range cases {
		if got := cleanReferrer(in); got != want {
			t.Errorf("cleanReferrer(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestRealIP(t *testing.T) {
	t.Run("prefers X-Real-IP", func(t *testing.T) {
		r, _ := http.NewRequest("GET", "/", nil)
		r.Header.Set("X-Real-IP", "1.2.3.4")
		r.Header.Set("X-Forwarded-For", "5.6.7.8")
		r.RemoteAddr = "9.9.9.9:1234"
		if got := realIP(r); got != "1.2.3.4" {
			t.Errorf("got %q, want 1.2.3.4", got)
		}
	})

	t.Run("falls back to X-Forwarded-For first entry", func(t *testing.T) {
		r, _ := http.NewRequest("GET", "/", nil)
		r.Header.Set("X-Forwarded-For", "5.6.7.8, 10.0.0.1")
		r.RemoteAddr = "9.9.9.9:1234"
		if got := realIP(r); got != "5.6.7.8" {
			t.Errorf("got %q, want 5.6.7.8", got)
		}
	})

	t.Run("falls back to RemoteAddr, stripping the port", func(t *testing.T) {
		r, _ := http.NewRequest("GET", "/", nil)
		r.RemoteAddr = "9.9.9.9:1234"
		if got := realIP(r); got != "9.9.9.9" {
			t.Errorf("got %q, want 9.9.9.9", got)
		}
	})
}

func TestGetEnv(t *testing.T) {
	os.Unsetenv("AYDEX_TEST_VAR")
	if got := getEnv("AYDEX_TEST_VAR", "default"); got != "default" {
		t.Errorf("got %q, want default", got)
	}
	os.Setenv("AYDEX_TEST_VAR", "custom")
	defer os.Unsetenv("AYDEX_TEST_VAR")
	if got := getEnv("AYDEX_TEST_VAR", "default"); got != "custom" {
		t.Errorf("got %q, want custom", got)
	}
}

func TestShouldDrop(t *testing.T) {
	cases := []struct {
		count, limit int64
		want         bool
	}{
		{count: 5, limit: 10, want: false},
		{count: 10, limit: 10, want: false},
		{count: 11, limit: 10, want: true},
		{count: 1_000_000, limit: -1, want: false}, // unlimited plan
		{count: 0, limit: 0, want: false},
		{count: 1, limit: 0, want: true},
	}
	for _, c := range cases {
		if got := shouldDrop(c.count, c.limit); got != c.want {
			t.Errorf("shouldDrop(%d, %d) = %v, want %v", c.count, c.limit, got, c.want)
		}
	}
}
