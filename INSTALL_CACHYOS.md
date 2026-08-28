# DSH Desktop - CachyOS Installation Guide

## One-Line Installation

For CachyOS (Arch Linux based), use the following one-line installation command:

```bash
curl -fsSL https://raw.githubusercontent.com/anywhere-labs/deepseek-harness-desktop/main/dsh-plugin-desktop/scripts/linux/install.sh | bash
```

Or with wget:

```bash
wget -qO- https://raw.githubusercontent.com/anywhere-labs/deepseek-harness-desktop/main/dsh-plugin-desktop/scripts/linux/install.sh | bash
```

## Features

### ✅ Vulkan Support
- Auto-detects your GPU (Intel, AMD, or NVIDIA)
- Installs appropriate Vulkan drivers
- Enables hardware-accelerated rendering
- Low resource usage with GPU acceleration

### 🎨 Anti-Gravity Physics Simulation
- Interactive particle physics simulation
- Mouse-based repulsion forces
- Particle-to-particle attraction
- Real-time rendering with trail effects
- Vulkan-accelerated glow effects when available
- Pause/Resume and Reset controls

### 📟 Codex UI Interface
- Minimalist code-like terminal interface
- Syntax highlighting for code
- Command prompt with history
- Line numbers and status bar
- Light/Dark theme support
- GPU-accelerated rendering

### 🚀 Lightweight Design
- Electron-based but optimized for low resource usage
- Efficient canvas-based rendering
- Smart particle count management
- Lazy loading of UI components
- Memory-efficient data structures

## Manual Installation

If you prefer manual installation:

### 1. Install Dependencies

```bash
# Update system
sudo pacman -Syu

# Install base development tools
sudo pacman -S --noconfirm base-devel git

# Install an AUR helper (yay recommended)
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si --noconfirm
cd ..
rm -rf yay
```

### 2. Install Vulkan Drivers

**For Intel GPUs:**
```bash
sudo pacman -S --noconfirm vulkan-intel vulkan-tools libva-intel-driver
```

**For AMD GPUs:**
```bash
sudo pacman -S --noconfirm vulkan-radeon vulkan-tools libva-mesa-driver
```

**For NVIDIA GPUs:**
```bash
# First install the driver (choose one):
sudo pacman -S --noconfirm nvidia-dkms nvidia-utils
# OR for newer cards:
sudo pacman -S --noconfirm nvidia-open-dkms nvidia-open-utils

# Then install Vulkan tools
sudo pacman -S --noconfirm vulkan-tools
```

### 3. Install DSH Desktop

```bash
# Using yay
yay -S dsh-desktop-bin

# OR using paru
paru -S dsh-desktop-bin

# OR manual AUR build
git clone https://aur.archlinux.org/dsh-desktop-bin.git
cd dsh-desktop-bin
makepkg -si --noconfirm
cd ..
rm -rf dsh-desktop-bin
```

## Usage

### Launch DSH Desktop

**From Command Line:**
```bash
dsh-desktop
# or
dsh-plugin-desktop
```

**From Application Menu:**
Look for "DSH Desktop" in your application launcher.

### Using Anti-Gravity Feature

The Anti-Gravity physics simulation is integrated into the desktop UI:

```tsx
import { AntiGravityCanvas } from 'dsh-plugin-desktop/client'

function MyApp() {
  return (
    <AntiGravityCanvas 
      settings={{
        particleCount: 150,
        gravityStrength: 0.5,
        mouseRepelForce: 2.0,
        showTrails: true,
      }}
      style={{ width: '100%', height: '400px' }}
    />
  )
}
```

### Using Codex UI

The Codex UI provides a lightweight code interface:

```tsx
import { CodexUI } from 'dsh-plugin-desktop/client'

function MyApp() {
  return (
    <CodexUI
      settings={{
        maxLines: 100,
        fontSize: 14,
        showLineNumbers: true,
        theme: 'dark',
      }}
      initialCode={[
        '// Welcome to DSH Desktop',
        'const app = new DSH()',
        'app.initialize()',
      ]}
      style={{ width: '100%', height: '500px' }}
    />
  )
}
```

## Configuration

### Window Material Settings

Edit `~/.config/dsh/settings.yaml`:

```yaml
dsh-desktop:
  mode: extended  # compatibility, extended, or advanced
  macosMaterial: transparent  # macOS only
  windowsMaterial: mica  # Windows only (off or mica)
```

### Vulkan Force Enable

If Vulkan is not auto-detected, you can force enable it in your application:

```tsx
<AntiGravityCanvas 
  settings={{
    vulkanAccelerated: true,  // Force enable
    particleCount: 200,
  }}
/>
```

## Troubleshooting

### Vulkan Not Working

1. Check if Vulkan is installed:
```bash
vulkaninfo | head -20
```

2. Verify GPU detection:
```bash
lspci | grep -i vga
```

3. Reinstall Vulkan drivers:
```bash
sudo pacman -S --noconfirm vulkan-tools vulkan-radeon  # AMD example
```

### Performance Issues

1. Reduce particle count:
```tsx
<AntiGravityCanvas settings={{ particleCount: 50 }} />
```

2. Disable trails:
```tsx
<AntiGravityCanvas settings={{ showTrails: false }} />
```

3. Use compatibility mode in settings

### Application Won't Start

1. Check logs:
```bash
dsh-desktop --export-diagnostics
```

2. Try running with verbose output:
```bash
DSH_DEBUG=1 dsh-desktop
```

3. Remove configuration and retry:
```bash
rm -rf ~/.config/dsh
dsh-desktop
```

## System Requirements

- **OS**: CachyOS / Arch Linux (x64)
- **CPU**: Dual-core processor (Quad-core recommended)
- **RAM**: 4GB minimum (8GB recommended)
- **GPU**: Any with OpenGL 3.3+ or Vulkan 1.0+ support
- **Storage**: 500MB free space
- **Display**: 1280x720 minimum resolution

## Uninstallation

```bash
# If installed via AUR helper
yay -Rns dsh-desktop-bin

# Manual removal
sudo rm -rf /opt/dsh-desktop
rm -rf ~/.config/dsh
rm -rf ~/.local/share/dsh-desktop
```

## Support

- **Documentation**: [User Guide](docs/user-guide.md)
- **Issues**: [GitHub Issues](https://github.com/anywhere-labs/deepseek-harness-desktop/issues)
- **Discord**: [Join Community](https://discord.gg/TJeGqKRNM)
- **Email**: t4wefan@qq.com

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Note**: This is a community project independent from DeepSeek AI. "DeepSeek Harness" is a trademark of DeepSeek AI.
