package config

import (
	"errors"

	"github.com/spf13/viper"
)

// ErrFailedToReadConfig is an error that is returned when the config file is not able to be read
var ErrFailedToReadConfig = errors.New("failed to read config")

// ErrFailedToParseConfig is an error that is returned when the config file is not able to be parsed
var ErrFailedToParseConfig = errors.New("failed to parse config")

type MacAddress struct {
	Address string
	Name    string
}

type Config struct {
	MacAddresses []MacAddress
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
	err = viperConfig.Unmarshal(&c)
	if err != nil {
		return nil, errors.Join(err, ErrFailedToParseConfig)
	}

	return &c, nil
}
