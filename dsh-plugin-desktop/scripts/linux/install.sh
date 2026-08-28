#!/usr/bin/env bash
# DSH Desktop - One-line installer for CachyOS (Arch Linux based)
# Lightweight, Vulkan-enabled desktop application for DeepSeek Harness

set -euo pipefail

readonly APP_NAME="DSH Desktop"
readonly PACKAGE_NAME="dsh-desktop"
readonly REPO_URL="https://github.com/anywhere-labs/deepseek-harness-desktop"
readonly AUR_PACKAGE="dsh-desktop-bin"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Do not run this script as root. Use a regular user account with sudo privileges."
        exit 1
    fi
}

detect_package_manager() {
    if command -v pacman &> /dev/null; then
        echo "pacman"
    elif command -v yay &> /dev/null; then
        echo "yay"
    elif command -v paru &> /dev/null; then
        echo "paru"
    else
        echo ""
    fi
}

install_aur_helper() {
    log_info "No AUR helper found. Installing yay..."
    
    # Install base-devel if not present
    if ! pacman -Q base-devel &> /dev/null; then
        log_info "Installing base-devel package group..."
        sudo pacman -S --noconfirm base-devel
    fi
    
    # Install git if not present
    if ! command -v git &> /dev/null; then
        log_info "Installing git..."
        sudo pacman -S --noconfirm git
    fi
    
    # Clone and build yay
    cd /tmp
    rm -rf yay
    git clone https://aur.archlinux.org/yay.git
    cd yay
    makepkg -si --noconfirm
    cd ..
    rm -rf yay
    cd - > /dev/null
    
    log_success "yay installed successfully"
}

install_vulkan_support() {
    log_info "Checking Vulkan support..."
    
    # Check if Vulkan drivers are already installed
    local vulkan_installed=false
    
    # Intel Vulkan
    if pacman -Q vulkan-intel &> /dev/null 2>&1; then
        vulkan_installed=true
    fi
    
    # AMD Vulkan (AMDGPU-PRO or radv)
    if pacman -Q vulkan-radeon &> /dev/null 2>&1; then
        vulkan_installed=true
    fi
    
    # NVIDIA Vulkan
    if pacman -Q nvidia-utils &> /dev/null 2>&1 || \
       pacman -Q nvidia-open-utils &> /dev/null 2>&1 || \
       pacman -Q nvidia-dkms &> /dev/null 2>&1 || \
       pacman -Q nvidia-open-dkms &> /dev/null 2>&1; then
        vulkan_installed=true
    fi
    
    # Generic Vulkan tools
    if pacman -Q vulkan-tools &> /dev/null 2>&1; then
        vulkan_installed=true
    fi
    
    if [[ "$vulkan_installed" == "false" ]]; then
        log_info "Installing Vulkan support packages..."
        
        # Detect GPU and install appropriate drivers
        if lspci | grep -i "intel" &> /dev/null; then
            log_info "Intel GPU detected, installing vulkan-intel..."
            sudo pacman -S --noconfirm vulkan-intel vulkan-tools libva-intel-driver
        elif lspci | grep -i "amd\|ati" &> /dev/null; then
            log_info "AMD GPU detected, installing vulkan-radeon..."
            sudo pacman -S --noconfirm vulkan-radeon vulkan-tools libva-mesa-driver
        elif lspci | grep -i "nvidia" &> /dev/null; then
            log_info "NVIDIA GPU detected, installing nvidia-utils..."
            # Check which nvidia driver is installed
            if pacman -Q nvidia-dkms &> /dev/null 2>&1; then
                sudo pacman -S --noconfirm nvidia-utils vulkan-tools
            elif pacman -Q nvidia-open-dkms &> /dev/null 2>&1; then
                sudo pacman -S --noconfirm nvidia-open-utils vulkan-tools
            else
                log_warning "NVIDIA GPU detected but no driver found. Please install nvidia-dkms or nvidia-open-dkms first."
                sudo pacman -S --noconfirm vulkan-tools
            fi
        else
            log_warning "Unknown GPU. Installing generic Vulkan tools..."
            sudo pacman -S --noconfirm vulkan-tools
        fi
        
        log_success "Vulkan support installed"
    else
        log_success "Vulkan support already present"
    fi
}

install_dsh_desktop() {
    local pm="$1"
    
    log_info "Installing DSH Desktop from AUR using $pm..."
    
    # Update package database
    if [[ "$pm" == "pacman" ]]; then
        log_info "Syncing package database..."
        sudo pacman -Sy --noconfirm
    fi
    
    # Install the AUR package
    if [[ "$pm" == "yay" ]] || [[ "$pm" == "paru" ]]; then
        $pm -S --noconfirm "$AUR_PACKAGE"
    else
        # Fallback: manual AUR installation
        log_info "Building from AUR manually..."
        cd /tmp
        rm -rf dsh-desktop-bin
        git clone https://aur.archlinux.org/dsh-desktop-bin.git
        cd dsh-desktop-bin
        makepkg -si --noconfirm
        cd ..
        rm -rf dsh-desktop-bin
        cd - > /dev/null
    fi
    
    log_success "DSH Desktop installed successfully"
}

verify_installation() {
    log_info "Verifying installation..."
    
    if command -v dsh-desktop &> /dev/null || command -v dsh-plugin-desktop &> /dev/null; then
        log_success "DSH Desktop command available"
        return 0
    else
        log_error "DSH Desktop command not found in PATH"
        return 1
    fi
}

show_post_install_message() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  DSH Desktop Installation Complete!  ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "You can now launch DSH Desktop using:"
    echo "  - Command line: ${BLUE}dsh-desktop${NC} or ${BLUE}dsh-plugin-desktop${NC}"
    echo "  - Application menu: Look for 'DSH Desktop'"
    echo ""
    echo "Features enabled:"
    echo "  ✓ Vulkan hardware acceleration"
    echo "  ✓ Lightweight Electron-based UI"
    echo "  ✓ Anti-gravity physics simulation"
    echo "  ✓ Codex UI interface"
    echo ""
    echo "For more information, visit: ${BLUE}${REPO_URL}${NC}"
    echo ""
    echo -e "${YELLOW}Note: First launch may take longer as it initializes the DeepSeek Harness environment.${NC}"
    echo ""
}

main() {
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     DSH Desktop Installer            ║${NC}"
    echo -e "${BLUE}║     For CachyOS / Arch Linux         ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""
    
    check_root
    
    log_info "Detecting package manager..."
    local pm
    pm=$(detect_package_manager)
    
    if [[ -z "$pm" ]]; then
        log_warning "No supported package manager found (pacman, yay, or paru)"
        install_aur_helper
        pm="yay"
        log_success "Using yay as package manager"
    else
        log_success "Found package manager: $pm"
    fi
    
    # Install Vulkan support
    install_vulkan_support
    
    # Install DSH Desktop
    install_dsh_desktop "$pm"
    
    # Verify installation
    if verify_installation; then
        show_post_install_message
        exit 0
    else
        log_error "Installation verification failed"
        exit 1
    fi
}

# Run main function
main "$@"
