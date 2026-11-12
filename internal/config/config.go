package config

import (
	"errors"
	"net"
	"reflect"

	"github.com/go-viper/mapstructure/v2"
	"github.com/spf13/viper"
)

// ErrFailedToReadConfig is an error that is returned when the config file is not able to be read
var ErrFailedToReadConfig = errors.New("failed to read config")

// ErrFailedToParseConfig is an error that is returned when the config file is not able to be parsed
var ErrFailedToParseConfig = errors.New("failed to parse config")

var ErrInvalidMACAddress = errors.New("invalid MAC address")

type WoLDevice struct {
	Address net.HardwareAddr
	Name    string
	Host    string
}

type Config struct {
	MacAddresses          []WoLDevice
	PrivilegedPing        bool
	OnlyRegisteredDevices bool
}

func stringToHardwareAddrHook() mapstructure.DecodeHookFunc {
	return func(from, to reflect.Type, data any) (any, error) {
		if from.Kind() != reflect.String || to != reflect.TypeFor[net.HardwareAddr]() {
			return data, nil
		}

		return net.ParseMAC(data.(string))
	}
}

func New(configFile string) (*Config, error) {
	viperConfig := viper.GetViper()

	if configFile != "" {
		viperConfig.SetConfigFile(configFile)
	} else {
		viperConfig.SetConfigName("config")
		viperConfig.SetConfigType("yaml")
		viperConfig.AddConfigPath(".")
	}
	err := viperConfig.ReadInConfig()
	if err != nil {
		return nil, errors.Join(err, ErrFailedToReadConfig)
	}

	var c Config
	err = viperConfig.Unmarshal(&c, viper.DecodeHook(
		mapstructure.ComposeDecodeHookFunc(
			mapstructure.StringToTimeDurationHookFunc(),
			mapstructure.StringToSliceHookFunc(","),
			stringToHardwareAddrHook())))
	if err != nil {
		return nil, errors.Join(err, ErrFailedToParseConfig)
	}

	return &c, nil
}

func (c Config) FindByName(name string) *WoLDevice {
	for _, mac := range c.MacAddresses {
		if mac.Name == name {
			return &mac
		}
	}

	return nil
}

func (c Config) FindByMac(address net.HardwareAddr) *WoLDevice {
	for _, mac := range c.MacAddresses {
		if mac.Address.String() == address.String() {
			return &mac
		}
	}

	return nil
}
