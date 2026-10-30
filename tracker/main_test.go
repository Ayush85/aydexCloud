package main

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"
)

func TestCleanReferrer(t *testing.T) {
	cases := map[string]string{
		"":                                      "",
		"https%3A%2F%2Fwww.google.com%2Fsearch": "google.com",
		"https%3A%2F%2Ftwitter.com%2Fhome":      "twitter.com",
		"not a url":                             "",
		"%zz":                                   "", // invalid percent-encoding
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

func TestHandleScript(t *testing.T) {
	// Plain request: readable script, one-day cache with stale-while-revalidate, ETag, nosniff.
	rec := httptest.NewRecorder()
	handleScript(rec, httptest.NewRequest("GET", "/script.js", nil))
	if rec.Code != 200 || rec.Body.String() != trackingScript {
		t.Fatalf("plain: code=%d, body matches=%v", rec.Code, rec.Body.String() == trackingScript)
	}
	cc := rec.Header().Get("Cache-Control")
	if !strings.Contains(cc, "max-age=86400") || !strings.Contains(cc, "stale-while-revalidate") {
		t.Errorf("Cache-Control = %q", cc)
	}
	if rec.Header().Get("ETag") == "" || rec.Header().Get("X-Content-Type-Options") != "nosniff" || rec.Header().Get("Vary") != "Accept-Encoding" {
		t.Errorf("missing ETag/nosniff/Vary: %v", rec.Header())
	}

	// gzip: smaller, correct Content-Length, decompresses to the exact script.
	req := httptest.NewRequest("GET", "/script.js", nil)
	req.Header.Set("Accept-Encoding", "gzip, br")
	rec = httptest.NewRecorder()
	handleScript(rec, req)
	if rec.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected gzip, got %q", rec.Header().Get("Content-Encoding"))
	}
	if rec.Header().Get("Content-Length") != strconv.Itoa(rec.Body.Len()) || rec.Body.Len() >= len(trackingScript)/2 {
		t.Errorf("gzip size %d vs raw %d, Content-Length %s", rec.Body.Len(), len(trackingScript), rec.Header().Get("Content-Length"))
	}
	zr, err := gzip.NewReader(bytes.NewReader(rec.Body.Bytes()))
	if err != nil {
		t.Fatal(err)
	}
	got, _ := io.ReadAll(zr)
	if string(got) != trackingScript {
		t.Error("gzip body does not round-trip")
	}

	// Conditional request: 304 with no body.
	req = httptest.NewRequest("GET", "/script.js", nil)
	req.Header.Set("If-None-Match", scriptETag)
	rec = httptest.NewRecorder()
	handleScript(rec, req)
	if rec.Code != http.StatusNotModified || rec.Body.Len() != 0 {
		t.Errorf("304: code=%d body=%d", rec.Code, rec.Body.Len())
	}

	// HEAD sends headers only; OPTIONS answers CORS preflight.
	rec = httptest.NewRecorder()
	handleScript(rec, httptest.NewRequest("HEAD", "/script.js", nil))
	if rec.Body.Len() != 0 {
		t.Error("HEAD returned a body")
	}
	rec = httptest.NewRecorder()
	handleScript(rec, httptest.NewRequest("OPTIONS", "/script.js", nil))
	if rec.Code != http.StatusNoContent || rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Errorf("OPTIONS: %d %v", rec.Code, rec.Header())
	}
}
