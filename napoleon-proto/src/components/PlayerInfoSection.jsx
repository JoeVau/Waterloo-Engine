import React from 'react';
import './Frame.css';

function PlayerInfoSection({ currentPlayer, turn, selectedHex, isBlue }) {
    return (
        <React.Fragment>
            <h3 className="sidebar-title">{isBlue ? 'Blue Player' : 'Red Player'}</h3>
            <p className="sidebar-text">Turn: {turn}</p>
            {
                selectedHex ? (
                    <p className="sidebar-text">Selected Hex: [{selectedHex[0]}, {selectedHex[1]}]</p>
                ) : (
                        <p className="sidebar-text">No hex selected</p>
                    )
            }
        </React.Fragment>
    );
}

export default PlayerInfoSection;