# Infomaniak AI Models Overview

**Last Updated:** 2025-12-30 (via API: `GET /1/ai/models`)

## Text Generation (LLM)

**Endpoint:** All models use `/2/ai/{product_id}/openai/v1/chat/completions`

**Note:** The `/1/ai/{product_id}/openai/chat/completions` endpoint is deprecated. Use the v2 endpoint for all models.

### Beta Models

| Model Name | Model ID | Description | Max Tokens | Status |
|------------|----------|-------------|------------|--------|
| Apertus-70B | `swiss-ai/Apertus-70B-Instruct-2509` | Swiss-specific model | 65,536 | Beta |
| GPT-OSS-120B | `openai/gpt-oss-120b` | OpenAI open source model | 131,072 | Beta |

### Stable Models

| Model Name | Model ID | Description | Max Tokens | Status |
|------------|----------|-------------|------------|--------|
| Llama 3.3 | `llama3` | Meta's open source LLM | 100,000 | Ready |
| Granite 3.1 | `granite` | IBM's granite-3.1-8b | 128,000 | Ready |
| Mistral Small 3.2 | `mistral3` | Mistral-Small-3.2-24B-Instruct-2506 | 128,000 | Ready |
| Qwen3 VL | `qwen3` | Qwen/Qwen3-VL-235B-A22B-Instruct (multimodal) | 262,144 | Ready |
| Gemma 3n | `gemma3n` | Gemma-3n-E4B-it | 32,000 | Ready |

## Audio Models

| Model Name | Short Name/ID | Description |
|------------|---------------|-------------|
| Whisper | `whisper` | Audio transcription model |

## Image Generation

| Model Name | Short Name/ID | Description |
|------------|---------------|-------------|
| SDXL Lightning | `sdxl_lightning` | Fast image generation |
| Flux | `flux` | Advanced image generation |

## API Endpoint

- **Base URL:** `https://api.infomaniak.com/2/ai/106600/openai`
- **Chat Completions:** `${baseUrl}/v1/chat/completions`
- **Models List:** `https://api.infomaniak.com/1/ai/models`

## Usage Notes

- All models use OpenAI-compatible API format
- Authentication via Bearer token
- Model names should be used exactly as shown in the "Short Name/ID" column

## Sources

- [Infomaniak AI Tools](https://www.infomaniak.com/en/hosting/ai-tools/open-source-models)
- [API Documentation](https://developer.infomaniak.com/docs/api/get/1/ai/models)
