package filter

import "testing"

func TestIsBotUA(t *testing.T) {
	cases := map[string]bool{
		"":    true,
		"   ": true,
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120 Safari/537.36": true,
		"curl/8.4.0":           true,
		"python-requests/2.31": true,
		"Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)":                                                    true,
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15": false,
		"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148":                             false,
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36":       false,
	}
	for ua, want := range cases {
		if got := IsBotUA(ua); got != want {
			t.Errorf("IsBotUA(%q) = %v, want %v", ua, got, want)
		}
	}
}

func TestIsSpamReferrer(t *testing.T) {
	cases := map[string]bool{
		"semalt.com":          true,
		"sub.semalt.com":      true,
		"SEMALT.com":          true,
		"google.com":          false,
		"notsemalt.com":       false,
		"":                    false,
		"example.semalt.com.": false, // trailing-dot FQDN is not matched (never produced by the tracker)
	}
	for host, want := range cases {
		if got := IsSpamReferrer(host); got != want {
			t.Errorf("IsSpamReferrer(%q) = %v, want %v", host, got, want)
		}
	}
	AddSpamReferrers([]string{" Custom-Spam.example ", ""})
	if !IsSpamReferrer("a.custom-spam.example") {
		t.Error("AddSpamReferrers entry not honoured")
	}
}

func TestNormalizeEvent(t *testing.T) {
	cases := []struct {
		in       string
		clean    string
		internal bool
		ok       bool
	}{
		{"", "pageview", false, true},
		{"  ", "pageview", false, true},
		{"signup", "signup", false, true},
		{"_dur", "_dur", true, true},
		{"_rage", "_rage", true, true},
		{"_secret", "", false, false},
		{"_", "", false, false},
	}
	for _, c := range cases {
		clean, internal, ok := NormalizeEvent(c.in)
		if clean != c.clean || internal != c.internal || ok != c.ok {
			t.Errorf("NormalizeEvent(%q) = (%q,%v,%v), want (%q,%v,%v)", c.in, clean, internal, ok, c.clean, c.internal, c.ok)
		}
	}
	long := make([]byte, MaxEventNameLen+1)
	for i := range long {
		long[i] = 'a'
	}
	if _, _, ok := NormalizeEvent(string(long)); ok {
		t.Error("over-long event name should be dropped")
	}
}

func TestClampPropsAndURL(t *testing.T) {
	if got := ClampProps(`{"revenue":49}`); got != `{"revenue":49}` {
		t.Errorf("valid props changed: %q", got)
	}
	if got := ClampProps(`{not json`); got != "" {
		t.Errorf("invalid JSON should be dropped, got %q", got)
	}
	big := `{"a":"` + string(make([]byte, MaxPropsLen)) + `"}`
	if got := ClampProps(big); got != "" {
		t.Error("oversized props should be dropped")
	}
	long := make([]byte, MaxURLLen+10)
	for i := range long {
		long[i] = 'x'
	}
	if got := ClampURL(string(long)); len(got) != MaxURLLen {
		t.Errorf("ClampURL length = %d", len(got))
	}
}
