# Infomaniak AI Models Overview

## Text Generation (LLM)

| Model Name | Short Name/ID | Description |
|------------|---------------|-------------|
| Apertus-70B | `swiss-ai/Apertus-70B-Instruct-2509` | Swiss-specific model (currently in use) |
| Qwen3 | `qwen3` | General purpose LLM |
| Qwen3 Vision-Language | `Qwen/Qwen3-VL-235B-A22B-Instruct` | Multimodal model with vision capabilities |
| Mistral | `mistral` | General purpose LLM |
| Mixtral | `mixtral` | Mixture of experts model |
| DeepSeek | `deepseek` | General purpose LLM |
| Llama | `llama` | Meta's open source LLM |
| Granite | `granite` | IBM's open source LLM |

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
