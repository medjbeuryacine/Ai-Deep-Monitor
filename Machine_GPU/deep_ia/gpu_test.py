import torch

print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU count: {torch.cuda.device_count()}")
print(f"Current device: {torch.cuda.current_device()}")
print(f"Device name: {torch.cuda.get_device_name(0)}")

# Test de calcul
if torch.cuda.is_available():
    x = torch.randn(10000, 10000).cuda()
    y = torch.randn(10000, 10000).cuda()
    z = (x @ y).mean()
    print(f"GPU calculation successful! Result: {z.item()}")
else:
    print("GPU not available")