# System Architecture

**Project:** PolyVis | **Version:** 1.0

This platform adheres to the **Principle of Effective Low-Tech Defence**. It avoids complex build chains in favor of raw, editable standards (HTML/CSS/JS).

## Deployment Pipeline

We use a manual "Push" architecture via SFTP, ensuring total control over the artifacts.

```dot
digraph Architecture {
    rankdir=TB;
    node [shape=box, fontname="Courier", margin="0.2,0.1", style=filled, fillcolor="white"];
    edge [fontname="Courier"];

    subgraph cluster_local {
        label = "Local Environment (Mac)";
        style=dashed;
        VSCode [label="VS Code\n(Editor)"];
        LocalFile [label="File System\n(Source of Truth)"];
    }

    subgraph cluster_transport {
        label = "Transport Layer";
        style=dotted;
        Cyberduck [label="Cyberduck\n(SFTP Client)"];
    }

    subgraph cluster_server {
        label = "Ionos Hosting (Linux)";
        style=solid;
        Apache [label="Apache Server"];
        Public [label="/httpdocs\n(Public Root)"];
        Docs [label="/docs\n(Markdown Files)"];
    }

    VSCode -> LocalFile [label="Edit"];
    LocalFile -> Cyberduck [label="Drag & Drop"];
    Cyberduck -> Public [label="Upload"];
    Public -> Apache [label="Serve"];
    Docs -> Apache;
}
```


## Source Code

[GitHub Repository](https://github.com/pjsvis/polyvis)
