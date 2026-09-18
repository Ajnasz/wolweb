package services

import (
	"net"
	"testing"
)

func TestGetBroadcastAddress(t *testing.T) {
	tests := []struct {
		name string
		addr net.Addr
		want string
	}{
		{
			name: "ipv4 /24",
			addr: &net.IPNet{IP: net.IPv4(192, 168, 1, 42), Mask: net.CIDRMask(24, 32)},
			want: "192.168.1.255",
		},
		{
			name: "ipv4 /16",
			addr: &net.IPNet{IP: net.IPv4(10, 0, 5, 6), Mask: net.CIDRMask(16, 32)},
			want: "10.0.255.255",
		},
		{
			name: "ipv6 address",
			addr: &net.IPNet{IP: net.ParseIP("2001:db8::1"), Mask: net.CIDRMask(64, 128)},
			want: "",
		},
		{
			name: "non-IPNet addr",
			addr: &net.UnixAddr{Name: "/tmp/sock", Net: "unix"},
			want: "",
		},
		{
			name: "ipv4 IP with mismatched 16-byte mask",
			addr: &net.IPNet{IP: net.IPv4(192, 168, 1, 42), Mask: net.CIDRMask(120, 128)},
			want: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getBroadcastAddress(tt.addr)
			if got != tt.want {
				t.Errorf("getBroadcastAddress() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestGetBroadcastAddresses_NonexistentInterface(t *testing.T) {
	// net.Interface.Addrs() looks up addresses by index; a nonexistent
	// index yields an empty slice with a nil error rather than failing.
	iface := net.Interface{Index: -1, Name: "nonexistent0"}

	addrs, err := getBroadcastAddresses(iface)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(addrs) != 0 {
		t.Errorf("expected no addresses, got %v", addrs)
	}
}
