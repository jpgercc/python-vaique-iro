import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button


# Valores iniciais dos parâmetros
distortion_factor = 0.5
body_radius = 1.0


def generate_grid_and_distortion(distortion_factor, body_radius):
    grid_range = 10
    num_points = 20
    x_coords = np.linspace(-grid_range, grid_range, num_points)
    y_coords = np.linspace(-grid_range, grid_range, num_points)
    original_grid_lines_x = []
    original_grid_lines_y = []
    for y_val in y_coords:
        original_grid_lines_x.append(x_coords)
        original_grid_lines_y.append(np.full_like(x_coords, y_val))
    for x_val in x_coords:
        original_grid_lines_x.append(np.full_like(y_coords, x_val))
        original_grid_lines_y.append(y_coords)
    distorted_grid_lines_x = []
    distorted_grid_lines_y = []
    def apply_distortion(px, py, factor, radius):
        distance = np.sqrt(px**2 + py**2)
        if distance < radius:
            distance = radius
        distortion_strength = factor / distance**2
        if distance > radius:
            unit_vector_x = -px / distance
            unit_vector_y = -py / distance
            delta_x = unit_vector_x * distortion_strength
            delta_y = unit_vector_y * distortion_strength
            new_px = px + delta_x
            new_py = py + delta_y
            new_distance = np.sqrt(new_px**2 + new_py**2)
            if new_distance < radius:
                new_px = (new_px / new_distance) * radius
                new_py = (new_py / new_distance) * radius
        else:
            new_px = px
            new_py = py
        return new_px, new_py
    for i in range(len(original_grid_lines_x)):
        distorted_x_line = []
        distorted_y_line = []
        for j in range(len(original_grid_lines_x[i])):
            px, py = original_grid_lines_x[i][j], original_grid_lines_y[i][j]
            new_px, new_py = apply_distortion(px, py, distortion_factor, body_radius)
            distorted_x_line.append(new_px)
            distorted_y_line.append(new_py)
        distorted_grid_lines_x.append(np.array(distorted_x_line))
        distorted_grid_lines_y.append(np.array(distorted_y_line))
    return original_grid_lines_x, original_grid_lines_y, distorted_grid_lines_x, distorted_grid_lines_y


# --- Geração do Gráfico 2D com Sliders ---
fig, ax = plt.subplots(figsize=(10, 10))
plt.subplots_adjust(left=0.1, bottom=0.25)

def plot_grid(distortion_factor, body_radius):
    ax.clear()
    grid_range = 10
    original_grid_lines_x, original_grid_lines_y, distorted_grid_lines_x, distorted_grid_lines_y = generate_grid_and_distortion(distortion_factor, body_radius)
    for i in range(len(original_grid_lines_x)):
        ax.plot(original_grid_lines_x[i], original_grid_lines_y[i], 'k--', alpha=0.3, linewidth=0.5)
    for i in range(len(distorted_grid_lines_x)):
        ax.plot(distorted_grid_lines_x[i], distorted_grid_lines_y[i], 'b-', linewidth=1.5)
    circle = plt.Circle((0, 0), body_radius, color='red', alpha=0.7, label='Corpo Massivo')
    ax.add_artist(circle)
    ax.set_xlabel('X (unidades arbitrárias)')
    ax.set_ylabel('Y (unidades arbitrárias)')
    ax.set_title('Visualização da Distorção da Grade Espacial por um Corpo Massivo')
    ax.set_aspect('equal', adjustable='box')
    ax.set_xlim([-grid_range, grid_range])
    ax.set_ylim([-grid_range, grid_range])
    ax.legend()
    fig.canvas.draw_idle()

plot_grid(distortion_factor, body_radius)

# Sliders
axcolor = 'lightgoldenrodyellow'
ax_distortion = plt.axes([0.1, 0.12, 0.8, 0.03], facecolor=axcolor)
ax_radius = plt.axes([0.1, 0.07, 0.8, 0.03], facecolor=axcolor)
slider_distortion = Slider(ax_distortion, 'Distorção', 0.01, 2.0, valinit=distortion_factor, valstep=0.01)
slider_radius = Slider(ax_radius, 'Raio', 0.1, 5.0, valinit=body_radius, valstep=0.01)

# Botão para atualizar
#ax_button = plt.axes([0.8, 0.02, 0.1, 0.04])
#button = Button(ax_button, 'Atualizar')

def update(val=None):
    plot_grid(slider_distortion.val, slider_radius.val)

#button.on_clicked(update)
slider_distortion.on_changed(update)
slider_radius.on_changed(update)

plt.show()
