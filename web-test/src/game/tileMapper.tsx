import React, { useState, useRef, useEffect } from 'react';

const TilemapEditor = () => {
  const [image, setImage] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);
  const [editingTileName, setEditingTileName] = useState(null);
  const [scale, setScale] = useState(1); // 1x, 2x, 3x scaling
  const [currentTile, setCurrentTile] = useState({
    name: '',
    layer: 'bottom',
    solid: false,
    flipX: false,
    flipY: false
  });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  const TILE_SIZE = 16;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          setImage(event.target.result);
          drawCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJsonImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setTiles(data);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Scale canvas size
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Disable image smoothing for pixel-perfect scaling
    ctx.imageSmoothingEnabled = false;

    // Draw the scaled image
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);

    // Draw grid (scaled)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 0.5 * scale;

    const scaledTileSize = TILE_SIZE * scale;

    for (let x = 0; x <= img.width * scale; x += scaledTileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, img.height * scale);
      ctx.stroke();
    }

    for (let y = 0; y <= img.height * scale; y += scaledTileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(img.width * scale, y);
      ctx.stroke();
    }

    // Highlight selected tile (scaled)
    if (selectedTile) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(
        selectedTile.x * scaledTileSize,
        selectedTile.y * scaledTileSize,
        scaledTileSize,
        scaledTileSize
      );
    }

    // Highlight already defined tiles (scaled)
    tiles.forEach((tile, index) => {
      // Different color for the currently selected tile
      if (editingTileName && tile.name === editingTileName) {
        ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
      } else {
        ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
      }
      ctx.fillRect(
        tile.x * scaledTileSize,
        tile.y * scaledTileSize,
        scaledTileSize,
        scaledTileSize
      );

      // Draw tile name with offset for multiple tiles at same position (scaled)
      const tilesAtPosition = tiles.filter(t => t.x === tile.x && t.y === tile.y);
      const positionIndex = tilesAtPosition.findIndex(t => t === tile);

      ctx.fillStyle = 'white';
      ctx.font = `${8 * scale}px Arial`;
      ctx.fillText(
        tile.name.substring(0, 8),
        tile.x * scaledTileSize + (1 * scale),
        tile.y * scaledTileSize + (10 * scale) + (positionIndex * 8 * scale)
      );
    });
  };

  useEffect(() => {
    drawCanvas();
  }, [selectedTile, tiles, editingTileName, scale]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaledTileSize = TILE_SIZE * scale;
    const x = Math.floor((e.clientX - rect.left) / scaledTileSize);
    const y = Math.floor((e.clientY - rect.top) / scaledTileSize);

    setSelectedTile({ x, y });

    // If we're editing a tile, update its position immediately
    if (editingTileName) {
      const updatedTiles = tiles.map(tile =>
        tile.name === editingTileName
          ? { ...tile, x, y }
          : tile
      );
      setTiles(updatedTiles);
    } else {
      // Check if there's a tile at this position to load its properties
      const existingTile = tiles.find(t => t.x === x && t.y === y);
      if (existingTile) {
        setCurrentTile({
          name: existingTile.name,
          layer: existingTile.layer,
          solid: existingTile.solid || false,
          flipX: existingTile.flipX || false,
          flipY: existingTile.flipY || false
        });
      }
    }
  };

  const handleAddTile = () => {
    if (!selectedTile || !currentTile.name) return;

    const newTile = {
      name: currentTile.name,
      x: selectedTile.x,
      y: selectedTile.y,
      layer: currentTile.layer,
      ...(currentTile.solid && { solid: true }),
      ...(currentTile.flipX && { flipX: true }),
      ...(currentTile.flipY && { flipY: true })
    };

    // Remove any existing tile with the same name (not position, since we allow multiple tiles at same position)
    const filteredTiles = tiles.filter(t => t.name !== currentTile.name);
    setTiles([...filteredTiles, newTile]);
  };

  const clearSelection = () => {
    setSelectedTile(null);
    setEditingTileName(null);
    setCurrentTile({
      name: '',
      layer: 'bottom',
      solid: false,
      flipX: false,
      flipY: false
    });
  };

  const exportJson = () => {
    const dataStr = JSON.stringify(tiles, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'tilemap-definitions.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-full">
        <h1 className="text-2xl font-bold mb-4">Tilemap Editor</h1>

        {/* Defined Tiles Grid */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Defined Tiles (click to edit position)</h2>
            <button
              onClick={clearSelection}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              Clear Selection
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tiles.map((tile, index) => (
              <div
                key={index}
                onClick={() => {
                  setEditingTileName(tile.name);
                  setCurrentTile({
                    name: tile.name,
                    layer: tile.layer,
                    solid: tile.solid || false,
                    flipX: tile.flipX || false,
                    flipY: tile.flipY || false
                  });
                  setSelectedTile({ x: tile.x, y: tile.y });
                }}
                className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                  editingTileName === tile.name
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {tile.name} ({tile.x},{tile.y})
                {(tile.flipX || tile.flipY) &&
                  <span className="text-yellow-400 ml-1">
                    {tile.flipX && 'X'}{tile.flipY && 'Y'}
                  </span>
                }
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Canvas Section */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex gap-2 mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png"
                  onChange={handleImageUpload}
                  className="text-sm"
                />
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleJsonImport}
                  className="text-sm"
                />
                <button
                  onClick={exportJson}
                  className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Export JSON
                </button>
              </div>
              
              <div className="flex gap-2 mb-4">
                <label className="text-sm text-gray-300">Scale:</label>
                <select
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="px-2 py-1 bg-gray-700 rounded text-sm"
                >
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={3}>3x</option>
                </select>
              </div>

              {image ? (
                <div className="overflow-auto border border-gray-700 rounded">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded">
                  Upload a PNG tilemap to get started
                </div>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="w-64">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">
                {editingTileName ? `Editing: ${editingTileName}` : 'Define New Tile'}
              </h2>

              {selectedTile && (
                <div className="text-sm text-gray-400 mb-2">
                  Position: ({selectedTile.x}, {selectedTile.y})
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  value={currentTile.name}
                  onChange={(e) => setCurrentTile({...currentTile, name: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && !editingTileName && handleAddTile()}
                  className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                  placeholder="Tile name"
                  disabled={editingTileName}
                />

                <select
                  value={currentTile.layer}
                  onChange={(e) => setCurrentTile({...currentTile, layer: e.target.value})}
                  className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
                >
                  <option value="bottom">bottom</option>
                  <option value="sprite">sprite</option>
                </select>

                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={currentTile.solid}
                    onChange={(e) => setCurrentTile({...currentTile, solid: e.target.checked})}
                    className="mr-2"
                  />
                  Solid
                </label>

                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={currentTile.flipX}
                    onChange={(e) => setCurrentTile({...currentTile, flipX: e.target.checked})}
                    className="mr-2"
                  />
                  Flip X
                </label>

                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={currentTile.flipY}
                    onChange={(e) => setCurrentTile({...currentTile, flipY: e.target.checked})}
                    className="mr-2"
                  />
                  Flip Y
                </label>

                {!editingTileName && (
                  <button
                    onClick={handleAddTile}
                    disabled={!selectedTile || !currentTile.name}
                    className="w-full py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm"
                  >
                    Add Tile
                  </button>
                )}

                {editingTileName && (
                  <>
                    <button
                      onClick={() => {
                        const updatedTiles = tiles.map(tile =>
                          tile.name === editingTileName
                            ? { ...tile, ...currentTile }
                            : tile
                        );
                        setTiles(updatedTiles);
                      }}
                      className="w-full py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Update Properties
                    </button>

                    <button
                      onClick={() => {
                        setTiles(tiles.filter(t => t.name !== editingTileName));
                        clearSelection();
                      }}
                      className="w-full py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Delete Tile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TilemapEditor;
