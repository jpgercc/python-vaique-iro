import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.widgets import Slider, Button


# Valores iniciais dos parâmetros
mass_factor = 1000.0
min_radius = 1.0


def generate_surface(mass_factor, min_radius):
    x = np.linspace(-10, 10, 100)
    y = np.linspace(-10, 10, 100)
    X, Y = np.meshgrid(x, y)
    R = np.sqrt(X**2 + Y**2)
    R[R < min_radius] = min_radius
    Z = -mass_factor / R
    return X, Y, Z


# --- Geração do Gráfico 3D com Sliders ---
fig = plt.figure(figsize=(10, 8))
plt.subplots_adjust(left=0.1, bottom=0.25)
ax = fig.add_subplot(111, projection='3d')

def plot_surface(mass_factor, min_radius):
    ax.clear()
    X, Y, Z = generate_surface(mass_factor, min_radius)
    surf = ax.plot_surface(X, Y, Z, cmap='viridis', edgecolor='none')
    ax.set_xlabel('X (unidades arbitrárias)')
    ax.set_ylabel('Y (unidades arbitrárias)')
    ax.set_zlabel('Curvatura / Potencial (unidades arbitrárias)')
    ax.set_title('Visualização da Curvatura Espacial Próximo a um Corpo Massivo')
    ax.view_init(elev=30, azim=45)
    ax.scatter([0], [0], [Z.min()], color='red', s=100, label='Corpo Massivo')
    ax.text(0, 0, Z.min() * 0.8, 'Corpo Massivo', color='white', fontsize=10, ha='center')
    ax.legend()
    fig.canvas.draw_idle()

plot_surface(mass_factor, min_radius)

# Sliders
axcolor = 'lightgoldenrodyellow'
ax_mass = plt.axes([0.1, 0.12, 0.8, 0.03], facecolor=axcolor)
ax_radius = plt.axes([0.1, 0.07, 0.8, 0.03], facecolor=axcolor)
slider_mass = Slider(ax_mass, 'Fator de Massa', 10.0, 5000.0, valinit=mass_factor, valstep=10.0)
slider_radius = Slider(ax_radius, 'Raio Mínimo', 0.1, 5.0, valinit=min_radius, valstep=0.01)

# Botão para atualizar
ax_button = plt.axes([0.8, 0.02, 0.1, 0.04])
button = Button(ax_button, 'Atualizar')

def update(val=None):
    plot_surface(slider_mass.val, slider_radius.val)

button.on_clicked(update)
slider_mass.on_changed(update)
slider_radius.on_changed(update)

plt.show()
