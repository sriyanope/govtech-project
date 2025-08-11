from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    rain_penalty: float = 2.5   # multiply length for unsheltered edges

settings = Settings()      # auto-loads from environment
